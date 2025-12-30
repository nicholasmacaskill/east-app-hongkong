// run_sql.ts
// Updated: Hyrox & EAST60 Prices (250 Credits)

import getDbPool from './app/lib/db';
import { Pool } from 'pg';

// --- CONFIGURATION: FIXED USER IDs ---
const TEST_USER_ID = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';
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
  p_user_id uuid,
  p_session_id bigint,
  p_attendee_id uuid default null
)
returns json
language plpgsql
security definer
as $$
declare
  v_credit_cost int;
  v_user_credits int;
begin
  select credit_cost into v_credit_cost from sessions where id = p_session_id;
  select credits into v_user_credits from profiles where id = p_user_id;

  if v_credit_cost is null then
    return json_build_object('success', false, 'message', 'Session cost not defined.');
  end if;

  if v_user_credits < v_credit_cost then
    return json_build_object('success', false, 'message', 'Insufficient credits.');
  end if;

  update profiles set credits = credits - v_credit_cost where id = p_user_id;
  
  -- Use attendee_id if provided, otherwise user_id
  insert into registrations (user_id, session_id) values (COALESCE(p_attendee_id, p_user_id), p_session_id);

  return json_build_object('success', true, 'message', 'Booking confirmed!', 'new_balance', v_user_credits - v_credit_cost);
end;
$$;
`;

const BOOKING_FUNCTION_SQL_V2 = `
create or replace function book_session_with_credits(
  p_user_id uuid,
  p_session_id bigint,
  p_attendee_id uuid default null
)
returns json
language plpgsql
security definer
as $$
declare
  v_credit_cost int;
  v_user_credits int;
begin
  select credit_cost into v_credit_cost from sessions where id = p_session_id;
  select credits into v_user_credits from profiles where id = p_user_id;

  if v_credit_cost is null then
    return json_build_object('success', false, 'message', 'Session cost not defined.');
  end if;

  if v_user_credits < v_credit_cost then
    return json_build_object('success', false, 'message', 'Insufficient credits.');
  end if;

  update profiles set credits = credits - v_credit_cost where id = p_user_id;
  
  -- Use attendee_id if provided, otherwise user_id
  insert into registrations (user_id, session_id) values (COALESCE(p_attendee_id, p_user_id), p_session_id);

  return json_build_object('success', true, 'message', 'Booking confirmed!', 'new_balance', v_user_credits - v_credit_cost);
end;
$$;
`;

const CANCEL_FUNCTION_SQL = `
create or replace function cancel_session_and_refund(
  p_user_id uuid,
  p_session_id bigint
)
returns json
language plpgsql
security definer
as $$
declare
  v_credit_cost int;
  v_registration_exists bool;
begin
  select exists(select 1 from registrations where user_id = p_user_id and session_id = p_session_id) into v_registration_exists;

  if not v_registration_exists then
    return json_build_object('success', false, 'message', 'Booking not found.');
  end if;

  select credit_cost into v_credit_cost from sessions where id = p_session_id;

  if v_credit_cost is null then
    delete from registrations where user_id = p_user_id and session_id = p_session_id;
    return json_build_object('success', true, 'message', 'Cancellation confirmed.');
  end if;

  update profiles set credits = credits + v_credit_cost where id = p_user_id;
  delete from registrations where user_id = p_user_id and session_id = p_session_id;

  return json_build_object('success', true, 'message', 'Cancellation successful. Credits refunded.', 'refund_amount', v_credit_cost);
end;
$$;
`;

const schemaCommands = [

  `CREATE EXTENSION IF NOT EXISTS "pgcrypto";`,

  // 1. DROP EVERYTHING FIRST
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

  // 2. CREATE TABLES
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
        role TEXT DEFAULT 'player'
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

  // 3. FACILITIES
  `INSERT INTO sessions(title, category, instructor, start_time, end_time, image_url, description, credit_cost) VALUES
  ('Locker', 'FACILITY', 'Staff', NOW() + interval '1 days 08:00:00', NOW() + interval '1 days 22:00:00', 'https://cdn.shopify.com/s/files/1/0759/3721/8848/files/Facility3.png?v=1765941246', 'Secure your belongings and Sports gear.', 1000),
  ('Golf Simulator', 'FACILITY', 'Staff', NOW() + interval '1 days 12:00:00', NOW() + interval '1 days 13:00:00', 'https://cdn.shopify.com/s/files/1/0759/3721/8848/files/Facility2.png?v=1765941246', 'Experience virtual golf.', 200),
('Shooting Pad', 'FACILITY', 'Staff', NOW() + interval '1 days 14:00:00', NOW() + interval '1 days 15:00:00', 'https://cdn.shopify.com/s/files/1/0759/3721/8848/files/Facility4.png?v=1765941249', 'Practice your shooting skills.', 50); `,

  // 4. CLASSES (Updated Prices to 250)
  `INSERT INTO sessions(title, category, instructor, start_time, end_time, image_url, description, credit_cost) VALUES
  ('Hyrox', 'CLASS', 'Coach Connor', NOW() + interval '2 days 18:00:00', NOW() + interval '2 days 19:00:00', 'https://cdn.shopify.com/s/files/1/0759/3721/8848/files/hyrox_b8249f8b-911d-466f-bd0f-a6c32a096647.png?v=1765941270', 'Prepare for your upcoming Hyrox Event.', 250),
  ('EAST60', 'CLASS', 'Coach Tim', NOW() + interval '3 days 18:00:00', NOW() + interval '3 days 19:00:00', 'https://cdn.shopify.com/s/files/1/0759/3721/8848/files/WhatsApp_Image_2024-08-27_at_11.46.59.jpg?v=1724730513', 'High-intensity functional fitness training.', 250); `,

  // 5. PRIVATE LESSONS (Category: 'PRIVATE')
  `INSERT INTO sessions(title, category, instructor, start_time, end_time, image_url, coach_image_url, description, credit_cost) VALUES
--SHOOTING(250 Credits)
  ('Shooting', 'PRIVATE', 'Coach Ben', NOW() + interval '3 days 11:00:00', NOW() + interval '3 days 12:00:00',
    'https://cdn.shopify.com/s/files/1/0759/3721/8848/files/snipes.jpg?v=1765941161',
    'https://cdn.shopify.com/s/files/1/0759/3721/8848/files/ben.jpg?v=1765941257',
    'Shooting with Coach Ben', 250),

  ('Shooting', 'PRIVATE', 'Coach Rhett', NOW() + interval '3 days 12:00:00', NOW() + interval '3 days 13:00:00',
    'https://cdn.shopify.com/s/files/1/0759/3721/8848/files/snipes.jpg?v=1765941161',
    'https://cdn.shopify.com/s/files/1/0759/3721/8848/files/rhett.jpg?v=1765941257',
    'Shooting with Coach Rhett', 250),

('Shooting', 'PRIVATE', 'Coach Whitney', NOW() + interval '3 days 13:00:00', NOW() + interval '3 days 14:00:00',
  'https://cdn.shopify.com/s/files/1/0759/3721/8848/files/snipes.jpg?v=1765941161',
  'https://cdn.shopify.com/s/files/1/0759/3721/8848/files/whit.png?v=1765941257',
  'Shooting with Coach Whitney', 250),

('Shooting', 'PRIVATE', 'Coach Ryan', NOW() + interval '3 days 14:00:00', NOW() + interval '3 days 15:00:00',
  'https://cdn.shopify.com/s/files/1/0759/3721/8848/files/snipes.jpg?v=1765941161',
  'https://eastsportsgroup.com/cdn/shop/files/WhatsApp_Image_2025-09-26_at_16.03.36.jpg?v=1759211469&width=1500',
  'Shooting with Coach Ryan', 250),

--GOLF(800 Credits)
  ('Golf', 'PRIVATE', 'Coach Ben', NOW() + interval '4 days 09:00:00', NOW() + interval '4 days 10:00:00',
    'https://cdn.shopify.com/s/files/1/0759/3721/8848/files/ben.jpg?v=1765941257',
    'https://cdn.shopify.com/s/files/1/0759/3721/8848/files/ben.jpg?v=1765941257',
    'Golf with Coach Ben', 800),

  ('Golf', 'PRIVATE', 'Coach Rhett', NOW() + interval '4 days 10:00:00', NOW() + interval '4 days 11:00:00',
    'https://cdn.shopify.com/s/files/1/0759/3721/8848/files/rhett.jpg?v=1765941257',
    'https://cdn.shopify.com/s/files/1/0759/3721/8848/files/rhett.jpg?v=1765941257',
    'Golf with Coach Rhett', 800),

('Golf', 'PRIVATE', 'Coach Whitney', NOW() + interval '4 days 11:00:00', NOW() + interval '4 days 12:00:00',
  'https://cdn.shopify.com/s/files/1/0759/3721/8848/files/whit.png?v=1765941257',
  'https://cdn.shopify.com/s/files/1/0759/3721/8848/files/whit.png?v=1765941257',
  'Golf with Coach Whitney', 800),

--GYM(250 Credits)
  ('Gym', 'PRIVATE', 'Coach Ben', NOW() + interval '5 days 10:00:00', NOW() + interval '5 days 11:00:00',
    'https://cdn.shopify.com/s/files/1/0759/3721/8848/files/Facility5.png?v=1765941250',
    'https://cdn.shopify.com/s/files/1/0759/3721/8848/files/ben.jpg?v=1765941257',
    'Gym with Coach Ben', 250),

  ('Gym', 'PRIVATE', 'Coach Rhett', NOW() + interval '5 days 11:00:00', NOW() + interval '5 days 12:00:00',
    'https://cdn.shopify.com/s/files/1/0759/3721/8848/files/Facility5.png?v=1765941250',
    'https://cdn.shopify.com/s/files/1/0759/3721/8848/files/rhett.jpg?v=1765941257',
    'Gym with Coach Rhett', 250),

('Gym', 'PRIVATE', 'Coach Whitney', NOW() + interval '5 days 12:00:00', NOW() + interval '5 days 13:00:00',
  'https://cdn.shopify.com/s/files/1/0759/3721/8848/files/Facility5.png?v=1765941250',
  'https://cdn.shopify.com/s/files/1/0759/3721/8848/files/whit.png?v=1765941257',
  'Gym with Coach Whitney', 250),

('Gym', 'PRIVATE', 'Coach Seb', NOW() + interval '5 days 13:00:00', NOW() + interval '5 days 14:00:00',
  'https://cdn.shopify.com/s/files/1/0759/3721/8848/files/Facility5.png?v=1765941250',
  'https://cdn.shopify.com/s/files/1/0759/3721/8848/files/seb_655d89b0-5675-40f3-87cd-e0a867a5d4e5.jpg?v=1765941258',
  'Gym with Coach Seb', 250); `,

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