// run_sql.ts
// Updated: Hyrox & EAST60 Prices (250 Credits)

import getDbPool from '../../app/lib/db';
import { Pool } from 'pg';

// --- CONFIGURATION: FIXED USER IDs ---
const TEST_USER_ID = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';
const COACH_USER_ID = '722deeb8-289b-4652-9acb-f8e854cfbaf1';
const PARENT_USER_ID = '833deeb8-390c-5763-9acb-f8e854cfbaf2';
const TEST_USER_ID_2 = 'a1b2c3d4-e5f6-7890-1234-567890abcdef';

// --- TRIGGER LOGIC ---
const TRIGGER_SQL = [
  `
    CREATE OR REPLACE FUNCTION public.handle_new_user() 
    RETURNS trigger AS $$
    BEGIN
      INSERT INTO public.profiles (id, contact_email, first_name, last_name, username, avatar_url, role)
      VALUES (
        NEW.id, 
        NEW.email,
        split_part(NEW.email, '@', 1),
        '',
        split_part(NEW.email, '@', 1),
        'https://placehold.co/100',
        COALESCE(NEW.raw_user_meta_data->>'role', 'player')
      )
      ON CONFLICT (id) DO NOTHING;
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql SECURITY DEFINER;
    `,
  `DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;`,
  `
    CREATE TRIGGER on_auth_user_created
      AFTER INSERT ON auth.users
      FOR EACH ROW
      EXECUTE PROCEDURE public.handle_new_user();
    `
];

// --- BOOKING FUNCTIONS ---
const BOOKING_FUNCTION_SQL = `
create or replace function book_session_with_credits(
  p_user_id uuid,          -- The payer (who pays)
  p_session_id bigint,     -- The session
  p_attendee_id uuid       -- The attendee (who goes)
)
returns json
language plpgsql
security definer
as $$
declare
  v_credit_cost int;
  v_user_credits int;
  v_attendee_id uuid;
begin
  -- Determine attendee (default to payer if null)
  v_attendee_id := COALESCE(p_attendee_id, p_user_id);

  -- Check if already registered
  IF EXISTS (SELECT 1 FROM registrations WHERE user_id = v_attendee_id AND session_id = p_session_id) THEN
      RETURN json_build_object('success', false, 'message', 'Attendee is already registered.');
  END IF;

  select credit_cost into v_credit_cost from sessions where id = p_session_id;
  select credits into v_user_credits from profiles where id = p_user_id;

  if v_credit_cost is null then
    return json_build_object('success', false, 'message', 'Session cost not defined.');
  end if;

  if v_user_credits < v_credit_cost then
    return json_build_object('success', false, 'message', 'Insufficient credits.');
  end if;

  -- Deduct from PAYER
  update profiles set credits = credits - v_credit_cost where id = p_user_id;
  
  -- Insert with payer_id
  insert into registrations (user_id, session_id, payer_id) values (v_attendee_id, p_session_id, p_user_id);

  return json_build_object('success', true, 'message', 'Booking confirmed!', 'new_balance', v_user_credits - v_credit_cost);
end;
$$;
`;

const BOOKING_FUNCTION_SQL_V2 = BOOKING_FUNCTION_SQL; // Sync versions

const CANCEL_FUNCTION_SQL = `
create or replace function cancel_session_and_refund(
  p_attendee_id uuid,
  p_session_id bigint
)
returns json
language plpgsql
security definer
as $$
declare
  v_credit_cost int;
  v_payer_id uuid;
begin
  -- Check registration and get Payer
  SELECT payer_id INTO v_payer_id 
  FROM registrations 
  WHERE user_id = p_attendee_id AND session_id = p_session_id;

  if not found then
    return json_build_object('success', false, 'message', 'Booking not found.');
  end if;

  -- Default payer to attendee if null
  v_payer_id := COALESCE(v_payer_id, p_attendee_id);

  select credit_cost into v_credit_cost from sessions where id = p_session_id;

  if v_credit_cost is null then
    delete from registrations where user_id = p_attendee_id and session_id = p_session_id;
    return json_build_object('success', true, 'message', 'Cancellation confirmed.');
  end if;

  -- Refund PAYER
  update profiles set credits = credits + v_credit_cost where id = v_payer_id;
  delete from registrations where user_id = p_attendee_id and session_id = p_session_id;

  return json_build_object('success', true, 'message', 'Cancellation successful. Credits refunded.', 'refund_amount', v_credit_cost);
end;
$$;
`;

const schemaCommands = [

  `CREATE EXTENSION IF NOT EXISTS "pgcrypto";`,

  // 1. DROP TABLES FIRST (To release FK on auth.users)
  "DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;",
  "DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;",
  "DROP TABLE IF EXISTS registrations CASCADE;",
  "DROP TABLE IF EXISTS players_stats CASCADE;",
  "DROP TABLE IF EXISTS sessions CASCADE;",
  "DROP TABLE IF EXISTS profiles CASCADE;",
  "DROP TABLE IF EXISTS posts CASCADE;",
  "DROP TABLE IF EXISTS likes CASCADE;",
  "DROP TABLE IF EXISTS messages CASCADE;",
  "DROP TABLE IF EXISTS availability CASCADE;",
  "DROP TABLE IF EXISTS voice_commands CASCADE;",
  "DROP TABLE IF EXISTS player_relationships CASCADE;",
  "DROP TABLE IF EXISTS content_blocks CASCADE;",

  // 2. NOW DELETE USERS (Safe now that profiles is gone)
  `DELETE FROM auth.users WHERE email ILIKE ANY (ARRAY['admin@east.com', 'coach@east.com', 'parent@east.com', 'player@east.com']);`,

  // 3. CREATE TABLES
  `CREATE TABLE content_blocks (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
  );`,
  `ALTER TABLE content_blocks ENABLE ROW LEVEL SECURITY;`,
  `CREATE POLICY "Allow Public Read" ON content_blocks FOR SELECT USING (true);`,
  `CREATE POLICY "Allow Admin Update" ON content_blocks FOR ALL USING (
    auth.uid() IN (SELECT id FROM auth.users WHERE role = 'service_role' OR email = 'admin@east.com')
  );`, // Simplified admin check for MVP speed

  `CREATE TABLE profiles (
        id UUID REFERENCES auth.users(id) PRIMARY KEY,
        username TEXT, first_name TEXT, last_name TEXT, 
        mobile TEXT, contact_email TEXT, avatar_url TEXT, bio TEXT,
        tier TEXT DEFAULT 'free',
        stripe_customer_id TEXT, stripe_subscription_id TEXT,
        subscription_status TEXT DEFAULT 'inactive',
        credits INTEGER DEFAULT 100,
        gallery_images TEXT[] DEFAULT '{}',
        schedule_photo_url TEXT,
        role TEXT DEFAULT 'player',
        parent_id UUID REFERENCES profiles(id),
        intro_video_url TEXT,
        preferences JSONB DEFAULT '{}',
        team TEXT,
        position TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
    );`,

  // UPDATED: Added coach_image_url
  `CREATE TABLE sessions (
        id BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY, 
        title TEXT NOT NULL, 
        category TEXT, 
        instructor TEXT, 
        start_time TIMESTAMP WITH TIME ZONE NOT NULL, 
        end_time TIMESTAMP WITH TIME ZONE NOT NULL, 
        image_url TEXT, 
        coach_image_url TEXT,
        description TEXT,
        credit_cost INTEGER DEFAULT 10 
    );`,

  `CREATE TABLE availability (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        coach_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
        start_time TIMESTAMP WITH TIME ZONE NOT NULL,
        end_time TIMESTAMP WITH TIME ZONE NOT NULL,
        is_recurring BOOLEAN DEFAULT FALSE,
        status TEXT DEFAULT 'available',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
    );`,

  `CREATE TABLE voice_commands (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        coach_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
        command_text TEXT NOT NULL,
        processed_json JSONB,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
    );`,

  `CREATE TABLE registrations(
    id BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    session_id BIGINT REFERENCES sessions(id) ON DELETE CASCADE NOT NULL,
    payer_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    registered_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc':: text, now()),
    UNIQUE(user_id, session_id)
  ); `,

  `CREATE TABLE players_stats(
    id BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
    player_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    age INTEGER, season INTEGER, team TEXT,
    games_played_season INTEGER, games_played_total INTEGER,
    games_missed_healthy INTEGER, games_missed_injured INTEGER,
    goals_season INTEGER, goals_total INTEGER,
    assists_season INTEGER, assists_total INTEGER,
    gp INTEGER, points INTEGER, gwg INTEGER, ppg INTEGER, shg INTEGER, pim INTEGER,
    top_scorer_team BOOLEAN, top_scorer_league BOOLEAN, least_pim_team BOOLEAN, most_shots_team BOOLEAN,
    is_verified BOOLEAN DEFAULT false,
    verified_by UUID REFERENCES profiles(id),
    verified_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  ); `,

  `CREATE TABLE player_relationships (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    parent_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    child_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    relationship_type VARCHAR(50) DEFAULT 'parent_child',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(parent_id, child_id)
  );`,

  `CREATE TABLE posts(id BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY, user_id UUID REFERENCES profiles(id), image_url TEXT, caption TEXT, created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc':: text, now()), shared_post_id BIGINT REFERENCES posts(id)); `,
  `CREATE TABLE likes(id BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY, user_id UUID REFERENCES profiles(id), post_id BIGINT REFERENCES posts(id), UNIQUE(user_id, post_id)); `,
  `CREATE TABLE messages(id BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY, sender_id UUID, receiver_id UUID, content TEXT, image_url TEXT, created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc':: text, now()), shared_event_id BIGINT); `,

  // 3. DISABLE RLS
  `ALTER TABLE registrations DISABLE ROW LEVEL SECURITY; `,
  `ALTER TABLE profiles DISABLE ROW LEVEL SECURITY; `,
  `ALTER TABLE posts DISABLE ROW LEVEL SECURITY; `,
  `ALTER TABLE sessions DISABLE ROW LEVEL SECURITY; `,
  `ALTER TABLE players_stats DISABLE ROW LEVEL SECURITY; `,
  `ALTER TABLE messages DISABLE ROW LEVEL SECURITY; `,
  `ALTER TABLE availability DISABLE ROW LEVEL SECURITY; `,

  // 4. FUNCTIONS & TRIGGERS
  BOOKING_FUNCTION_SQL,
  CANCEL_FUNCTION_SQL,
  ...TRIGGER_SQL,

  // 5. PERMISSIONS
  `GRANT EXECUTE ON FUNCTION book_session_with_credits(uuid, bigint, uuid) TO authenticated; `,
  `GRANT EXECUTE ON FUNCTION cancel_session_and_refund(uuid, bigint) TO authenticated; `,
  `GRANT EXECUTE ON FUNCTION book_session_with_credits(uuid, bigint, uuid) TO service_role; `,
  `GRANT EXECUTE ON FUNCTION cancel_session_and_refund(uuid, bigint) TO service_role; `,

  // 6. STORAGE
  `INSERT INTO storage.buckets(id, name, public) VALUES('uploads', 'uploads', true) ON CONFLICT(id) DO NOTHING; `,
  `DROP POLICY IF EXISTS "Public Access" ON storage.objects; `,
  `CREATE POLICY "Public Access" ON storage.objects FOR ALL USING(bucket_id = 'uploads') WITH CHECK(bucket_id = 'uploads'); `,


  // --- USERS & PROFILES ---
  `INSERT INTO auth.users(instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, recovery_sent_at, last_sign_in_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, confirmation_token, email_change, email_change_token_new, recovery_token)
VALUES('00000000-0000-0000-0000-000000000000', '${TEST_USER_ID}', 'authenticated', 'authenticated', 'admin@east.com', crypt('password123', gen_salt('bf')), current_timestamp, current_timestamp, current_timestamp, '{"provider":"email","providers":["email"]}', '{}', current_timestamp, current_timestamp, '', '', '', '')
     ON CONFLICT(id) DO NOTHING; `,
  `INSERT INTO auth.identities(id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
VALUES('d4d4d4d4-d4d4-d4d4-d4d4-d4d4d4d4d4d4', '${TEST_USER_ID}', format('{"sub":"%s","email":"%s"}', '${TEST_USER_ID}', 'admin@east.com'):: jsonb, 'email', 'admin@east.com', current_timestamp, current_timestamp, current_timestamp)
     ON CONFLICT(id) DO NOTHING; `,

  `INSERT INTO profiles(id, username, first_name, last_name, mobile, contact_email, bio, avatar_url, role)
VALUES('${TEST_USER_ID}', 'admin.east', 'Admin', 'User', '+1 000 000 0000', 'admin@east.com', 'System Administrator.', 'https://images.unsplash.com/photo-1507591064344-4c6ce005b128?q=80&w=2940&auto=format&fit=crop', 'admin') 
     ON CONFLICT(id) DO UPDATE SET username = EXCLUDED.username, role = EXCLUDED.role, contact_email = EXCLUDED.contact_email; `,

  // --- COACH USER (coach@east.com / password123) ---
  `INSERT INTO auth.users(instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, recovery_sent_at, last_sign_in_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, confirmation_token, email_change, email_change_token_new, recovery_token)
VALUES('00000000-0000-0000-0000-000000000000', '${COACH_USER_ID}', 'authenticated', 'authenticated', 'coach@east.com', crypt('password123', gen_salt('bf')), current_timestamp, current_timestamp, current_timestamp, '{"provider":"email","providers":["email"]}', '{"role":"coach"}', current_timestamp, current_timestamp, '', '', '', '')
     ON CONFLICT(id) DO NOTHING; `,
  `INSERT INTO auth.identities(id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
VALUES('c4d4d4d4-c4d4-c4d4-c4d4-c4d4d4d4d4d4', '${COACH_USER_ID}', format('{"sub":"%s","email":"%s"}', '${COACH_USER_ID}', 'coach@east.com'):: jsonb, 'email', 'coach@east.com', current_timestamp, current_timestamp, current_timestamp)
     ON CONFLICT(id) DO NOTHING; `,

  `INSERT INTO profiles(id, username, first_name, last_name, mobile, contact_email, bio, avatar_url, role)
VALUES('${COACH_USER_ID}', 'coach.east', 'Coach', 'Demo', '+1 555 000 0000', 'coach@east.com', 'Elite Hockey Coach.', 'https://images.unsplash.com/photo-1580748141549-71748ddf0bdc?auto=format&fit=crop&q=80&w=800', 'coach') 
     ON CONFLICT(id) DO UPDATE SET username = EXCLUDED.username; `,

  // --- PARENT USER (parent@east.com / password123) ---
  `INSERT INTO auth.users(instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, recovery_sent_at, last_sign_in_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, confirmation_token, email_change, email_change_token_new, recovery_token)
VALUES('00000000-0000-0000-0000-000000000000', '${PARENT_USER_ID}', 'authenticated', 'authenticated', 'parent@east.com', crypt('password123', gen_salt('bf')), current_timestamp, current_timestamp, current_timestamp, '{"provider":"email","providers":["email"]}', '{"role":"parent"}', current_timestamp, current_timestamp, '', '', '', '')
     ON CONFLICT(id) DO NOTHING; `,
  `INSERT INTO auth.identities(id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
VALUES('e4d4d4d4-e4d4-e4d4-e4d4-e4d4d4d4d4d4', '${PARENT_USER_ID}', format('{"sub":"%s","email":"%s"}', '${PARENT_USER_ID}', 'parent@east.com'):: jsonb, 'email', 'parent@east.com', current_timestamp, current_timestamp, current_timestamp)
     ON CONFLICT(id) DO NOTHING; `,

  `INSERT INTO profiles(id, username, first_name, last_name, mobile, contact_email, bio, avatar_url, role)
VALUES('${PARENT_USER_ID}', 'parent.east', 'Parent', 'Demo', '+1 666 000 0000', 'parent@east.com', 'Hockey Parent.', 'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?auto=format&fit=crop&q=80&w=800', 'parent') 
     ON CONFLICT(id) DO UPDATE SET username = EXCLUDED.username; `,

  // --- PLAYER USER (player@east.com / password123) ---
  `INSERT INTO auth.users(instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, recovery_sent_at, last_sign_in_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, confirmation_token, email_change, email_change_token_new, recovery_token)
VALUES('00000000-0000-0000-0000-000000000000', '${TEST_USER_ID_2}', 'authenticated', 'authenticated', 'player@east.com', crypt('password123', gen_salt('bf')), current_timestamp, current_timestamp, current_timestamp, '{"provider":"email","providers":["email"]}', '{"role":"player"}', current_timestamp, current_timestamp, '', '', '', '')
     ON CONFLICT(id) DO NOTHING; `,
  `INSERT INTO auth.identities(id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
VALUES('f4d4d4d4-f4d4-f4d4-f4d4-f4d4d4d4d4d4', '${TEST_USER_ID_2}', format('{"sub":"%s","email":"%s"}', '${TEST_USER_ID_2}', 'player@east.com'):: jsonb, 'email', 'player@east.com', current_timestamp, current_timestamp, current_timestamp)
     ON CONFLICT(id) DO NOTHING; `,

  `INSERT INTO profiles(id, username, first_name, last_name, mobile, contact_email, bio, avatar_url, role, credits, preferences, parent_id)
VALUES('${TEST_USER_ID_2}', 'player.east', 'Test', 'Player', '+1 777 000 0000', 'player@east.com', 'Aspiring Athlete.', 'https://images.unsplash.com/photo-1547941126-be8c96fd6908?auto=format&fit=crop&q=80&w=800', 'player', 100, '{}', NULL) 
     ON CONFLICT(id) DO UPDATE SET username = EXCLUDED.username; `,

  `INSERT INTO players_stats(player_id, age, season, team, games_played_season, goals_season, points)
VALUES('${TEST_USER_ID}', 31, 3, 'RHINOS', 48, 110, 6)
     ON CONFLICT(id) DO NOTHING; `,

  // --- SESSIONS ---

  // 1. NEWS
  `INSERT INTO sessions(title, category, instructor, start_time, end_time, image_url, description) VALUES
  ('EAST High Performance Center Opening', 'NEWS', 'EAST Team', NOW(), NOW() + interval '30 days', 'https://cdn.shopify.com/s/files/1/0759/3721/8848/files/Facility1.png?v=1765941246', 'We are excited to announce the opening of our fitness center with the latest equipment and expert trainers.'),
  ('Golf League Starting Soon', 'NEWS', 'Golf Team', NOW(), NOW() + interval '30 days', 'https://cdn.shopify.com/s/files/1/0759/3721/8848/files/golf-league.png?v=1765941269', 'Join our upcoming golf league for all skill levels. Registration is now open for the winter season.'),
('Hyrox Team EAST', 'NEWS', 'Hyrox Team', NOW(), NOW() + interval '30 days', 'https://cdn.shopify.com/s/files/1/0759/3721/8848/files/hyrox_b8249f8b-911d-466f-bd0f-a6c32a096647.png?v=1765941270', 'Our Hyrox training program is launching soon. Sign up to improve your fitness and compete with Team EAST.'); `,

  // 2. EVENTS
  `INSERT INTO sessions(title, category, instructor, start_time, end_time, image_url, description) VALUES
  ('EAST Golf Classic 2', 'EVENT', 'EAST Sports', NOW() + interval '10 days 09:00:00', NOW() + interval '10 days 17:00:00', 'https://cdn.shopify.com/s/files/1/0759/3721/8848/files/Golf2.jpg?v=1765941578', 'EAST Golf Classic. Round 2 is set for January 31st, 2026. Save the date!'),
  ('EAST Adult 3v3', 'EVENT', 'EAST Sports', NOW() + interval '14 days 10:00:00', NOW() + interval '14 days 16:00:00', 'https://eastsportsgroup.com/cdn/shop/files/136cecf3-a757-4dae-a754-7e4f4f16e7d9.jpg?v=1704914815&width=3840', 'Adult 3v3 Tournament Live from Empire Rink on January 4th, 2026. Contact us to register!'); `,

  // 3. FACILITIES (Generated Slots for Next 30 Days)
  // We will generate slots dynamically using a SQL block instead of hardcoding
  `DO $$
  DECLARE
      i INT;
      day_offset INT;
      start_hour INT;
      base_date TIMESTAMP;
      slot_start TIMESTAMP;
      slot_end TIMESTAMP;
  BEGIN
      -- Loop for 30 days
      FOR day_offset IN 1..30 LOOP
          base_date := DATE_TRUNC('day', NOW() + (day_offset || ' days')::INTERVAL);
          
          -- Loop 9am to 5pm (17:00)
          FOR start_hour IN 9..16 LOOP 
              slot_start := base_date + (start_hour || ' hours')::INTERVAL;
              slot_end := base_date + (start_hour + 1 || ' hours')::INTERVAL;

              -- 1. Golf Sim North
              INSERT INTO sessions(title, category, instructor, start_time, end_time, image_url, description, credit_cost) 
              VALUES ('Golf Simulator - North Bay', 'FACILITY', 'Staff', slot_start, slot_end, 'https://cdn.shopify.com/s/files/1/0759/3721/8848/files/Facility2.png?v=1765941246', 'Private Golf Simulator Bay (North).', 200);

              -- 2. Golf Sim South
              INSERT INTO sessions(title, category, instructor, start_time, end_time, image_url, description, credit_cost) 
              VALUES ('Golf Simulator - South Bay', 'FACILITY', 'Staff', slot_start, slot_end, 'https://cdn.shopify.com/s/files/1/0759/3721/8848/files/Facility2.png?v=1765941246', 'Private Golf Simulator Bay (South).', 200);

              -- 3. Shooting Bay Blue
              INSERT INTO sessions(title, category, instructor, start_time, end_time, image_url, description, credit_cost) 
              VALUES ('Shooting Bay - Blue Pad', 'FACILITY', 'Staff', slot_start, slot_end, 'https://cdn.shopify.com/s/files/1/0759/3721/8848/files/Facility4.png?v=1765941249', 'Synthetic Ice Shooting Lane (Blue).', 100);

             -- 4. Shooting Bay Green
              INSERT INTO sessions(title, category, instructor, start_time, end_time, image_url, description, credit_cost) 
              VALUES ('Shooting Bay - Green Pad', 'FACILITY', 'Staff', slot_start, slot_end, 'https://cdn.shopify.com/s/files/1/0759/3721/8848/files/Facility4.png?v=1765941249', 'Synthetic Ice Shooting Lane (Green).', 100);

          END LOOP;
      END LOOP;
  END $$; `,

  // 4. CLASSES
  `INSERT INTO sessions(title, category, instructor, start_time, end_time, image_url, description, credit_cost) VALUES
  ('Hyrox', 'CLASS', 'Coach Connor', NOW() + interval '2 days 18:00:00', NOW() + interval '2 days 19:00:00', 'https://cdn.shopify.com/s/files/1/0759/3721/8848/files/hyrox_b8249f8b-911d-466f-bd0f-a6c32a096647.png?v=1765941270', 'Prepare for your upcoming Hyrox Event.', 250),
  ('EAST60', 'CLASS', 'Coach Tim', NOW() + interval '3 days 18:00:00', NOW() + interval '3 days 19:00:00', 'https://cdn.shopify.com/s/files/1/0759/3721/8848/files/WhatsApp_Image_2024-08-27_at_11.46.59.jpg?v=1724730513', 'High-intensity functional fitness training.', 250); `,

  // 5. PRIVATE LESSONS (Updated Pricing Structure)
  `INSERT INTO sessions(title, category, instructor, start_time, end_time, image_url, coach_image_url, description, credit_cost) VALUES
  
  -- SHOOTING (Senior Coach: 850, Junior Coach: 500)
  ('Shooting (Senior)', 'PRIVATE', 'Coach Ben', NOW() + interval '3 days 11:00:00', NOW() + interval '3 days 12:00:00',
    'https://cdn.shopify.com/s/files/1/0759/3721/8848/files/snipes.jpg?v=1765941161',
    'https://cdn.shopify.com/s/files/1/0759/3721/8848/files/ben.jpg?v=1765941257',
    'Elite Shooting with Senior Coach Ben.', 850),

  ('Shooting (Senior)', 'PRIVATE', 'Coach Rhett', NOW() + interval '3 days 12:00:00', NOW() + interval '3 days 13:00:00',
    'https://cdn.shopify.com/s/files/1/0759/3721/8848/files/snipes.jpg?v=1765941161',
    'https://cdn.shopify.com/s/files/1/0759/3721/8848/files/rhett.jpg?v=1765941257',
    'Elite Shooting with Senior Coach Rhett.', 850),

  ('Shooting (Junior)', 'PRIVATE', 'Coach Whitney', NOW() + interval '3 days 13:00:00', NOW() + interval '3 days 14:00:00',
    'https://cdn.shopify.com/s/files/1/0759/3721/8848/files/snipes.jpg?v=1765941161',
    'https://cdn.shopify.com/s/files/1/0759/3721/8848/files/whit.png?v=1765941257',
    'Development Shooting with Junior Coach Whitney.', 500),

  ('Shooting (Junior)', 'PRIVATE', 'Coach Ryan', NOW() + interval '3 days 14:00:00', NOW() + interval '3 days 15:00:00',
    'https://cdn.shopify.com/s/files/1/0759/3721/8848/files/snipes.jpg?v=1765941161',
    'https://eastsportsgroup.com/cdn/shop/files/WhatsApp_Image_2025-09-26_at_16.03.36.jpg?v=1759211469&width=1500',
    'Development Shooting with Junior Coach Ryan.', 500),

  -- PERSONAL TRAINING (700 Credits)
  ('Personal Training', 'PRIVATE', 'Coach Seb', NOW() + interval '5 days 10:00:00', NOW() + interval '5 days 11:00:00',
    'https://cdn.shopify.com/s/files/1/0759/3721/8848/files/Facility5.png?v=1765941250',
    'https://cdn.shopify.com/s/files/1/0759/3721/8848/files/seb_655d89b0-5675-40f3-87cd-e0a867a5d4e5.jpg?v=1765941258',
    '1-on-1 Gym Personal Training.', 700),
  
  ('Personal Training', 'PRIVATE', 'Coach Ben', NOW() + interval '5 days 11:00:00', NOW() + interval '5 days 12:00:00',
    'https://cdn.shopify.com/s/files/1/0759/3721/8848/files/Facility5.png?v=1765941250',
    'https://cdn.shopify.com/s/files/1/0759/3721/8848/files/ben.jpg?v=1765941257',
    '1-on-1 Gym Personal Training.', 700); `,

  `NOTIFY pgrst, 'reload schema'; `
];

async function runSql(pool: Pool, sqlQuery: string) {
  const client = await pool.connect();
  try { await client.query(sqlQuery); console.log(`✅ Executed: ${sqlQuery.substring(0, 50)}...`); }
  catch (e) { console.error(`❌ Failed: ${sqlQuery.substring(0, 50)}...`, e); }
  finally { client.release(); }
}

(async () => {
  const pool = getDbPool();
  for (const cmd of schemaCommands) await runSql(pool, cmd);
  await pool.end();
})();