-- PRODUCTION DATA RESTORATION
-- Extracted from run_sql.ts - Run this in Supabase SQL Editor

-- IMPORTANT: Disable RLS on sessions table to allow public read access
ALTER TABLE sessions DISABLE ROW LEVEL SECURITY;

-- 1. NEWS ARTICLES
INSERT INTO sessions(title, category, instructor, start_time, end_time, image_url, description) VALUES
  ('EAST High Performance Center Opening', 'NEWS', 'EAST Team', NOW(), NOW() + interval '30 days', 'https://cdn.shopify.com/s/files/1/0759/3721/8848/files/Facility1.png?v=1765941246', 'We are excited to announce the opening of our fitness center with the latest equipment and expert trainers.'),
  ('Golf League Starting Soon', 'NEWS', 'Golf Team', NOW(), NOW() + interval '30 days', 'https://cdn.shopify.com/s/files/1/0759/3721/8848/files/golf-league.png?v=1765941269', 'Join our upcoming golf league for all skill levels. Registration is now open for the winter season.'),
  ('Hyrox Team EAST', 'NEWS', 'Hyrox Team', NOW(), NOW() + interval '30 days', 'https://cdn.shopify.com/s/files/1/0759/3721/8848/files/hyrox_b8249f8b-911d-466f-bd0f-a6c32a096647.png?v=1765941270', 'Our Hyrox training program is launching soon. Sign up to improve your fitness and compete with Team EAST.');

-- 2. EVENTS
INSERT INTO sessions(title, category, instructor, start_time, end_time, image_url, description) VALUES
  ('EAST Golf Classic 2', 'EVENT', 'EAST Sports', NOW() + interval '10 days 09:00:00', NOW() + interval '10 days 17:00:00', 'https://cdn.shopify.com/s/files/1/0759/3721/8848/files/Golf2.jpg?v=1765941578', 'EAST Golf Classic. Round 2 is set for January 31st, 2026. Save the date!'),
  ('EAST Adult 3v3', 'EVENT', 'EAST Sports', NOW() + interval '14 days 10:00:00', NOW() + interval '14 days 16:00:00', 'https://eastsportsgroup.com/cdn/shop/files/136cecf3-a757-4dae-a754-7e4f4f16e7d9.jpg?v=1704914815&width=3840', 'Adult 3v3 Tournament Live from Empire Rink on January 4th, 2026. Contact us to register!');

-- 3. FACILITIES (Auto-generated slots for next 30 days)
DO $$
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
END $$;

-- 4. CLASSES
INSERT INTO sessions(title, category, instructor, start_time, end_time, image_url, description, credit_cost) VALUES
  ('Hyrox', 'CLASS', 'Coach Connor', NOW() + interval '2 days 18:00:00', NOW() + interval '2 days 19:00:00', 'https://cdn.shopify.com/s/files/1/0759/3721/8848/files/hyrox_b8249f8b-911d-466f-bd0f-a6c32a096647.png?v=1765941270', 'Prepare for your upcoming Hyrox Event.', 250),
  ('EAST60', 'CLASS', 'Coach Tim', NOW() + interval '3 days 18:00:00', NOW() + interval '3 days 19:00:00', 'https://cdn.shopify.com/s/files/1/0759/3721/8848/files/WhatsApp_Image_2024-08-27_at_11.46.59.jpg?v=1724730513', 'High-intensity functional fitness training.', 250);

-- 5. PRIVATE LESSONS
INSERT INTO sessions(title, category, instructor, start_time, end_time, image_url, coach_image_url, description, credit_cost) VALUES
  
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
    '1-on-1 Gym Personal Training.', 700);

-- Verify data inserted
SELECT category, COUNT(*) as count FROM sessions GROUP BY category ORDER BY category;
