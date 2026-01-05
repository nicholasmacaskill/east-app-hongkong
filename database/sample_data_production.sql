-- Production Sample Data for East App HK
-- Run this in Supabase SQL Editor to populate your database

-- 1. Add sample news articles
INSERT INTO news_articles (title, content, image_url, author_id, created_at) VALUES
('EAST Training Facility Now Open', 'Our state-of-the-art training facility is now officially open! Featuring premium courts, professional coaching staff, and cutting-edge technology to track your progress.', 'https://images.unsplash.com/photo-1580748141549-71748ddf0bdc?auto=format&fit=crop&q=80&w=800', (SELECT id FROM profiles WHERE role = 'admin' LIMIT 1), NOW() - INTERVAL '2 days'),
('Summer Training Program Announced', 'Join us this summer for an intensive training program designed to elevate your game. Limited spots available - register now!', 'https://images.unsplash.com/photo-1546519638-68e109498ffc?auto=format&fit=crop&q=80&w=800', (SELECT id FROM profiles WHERE role = 'admin' LIMIT 1), NOW() - INTERVAL '5 days');

--2. Add sample training sessions (upcoming)
INSERT INTO sessions (title, description, date, time, capacity, credit_cost, location, coach_id, created_at) VALUES
('Advanced Techniques Workshop', 'Intensive workshop focusing on advanced techniques and strategies. Perfect for intermediate to advanced players.', (CURRENT_DATE + INTERVAL '3 days')::date, '14:00:00', 12, 2, 'Court A', (SELECT id FROM profiles WHERE role = 'coach' OR role = 'admin' LIMIT 1), NOW()),
('Beginner Fundamentals', 'Learn the basics in this comprehensive beginner-friendly session. All equipment provided.', (CURRENT_DATE + INTERVAL '5 days')::date, '10:00:00', 15, 1, 'Court B', (SELECT id FROM profiles WHERE role = 'coach' OR role = 'admin' LIMIT 1), NOW()),
('Private Coaching Session', 'One-on-one coaching session tailored to your specific needs and goals.', (CURRENT_DATE + INTERVAL '7 days')::date, '16:00:00', 1, 5, 'Private Court', (SELECT id FROM profiles WHERE role = 'coach' OR role = 'admin' LIMIT 1), NOW()),
('Weekend Tournament Prep', 'Prepare for upcoming tournaments with competitive drills and strategy sessions.', (CURRENT_DATE + INTERVAL '4 days')::date, '09:00:00', 10, 3, 'Main Arena', (SELECT id FROM profiles WHERE role = 'coach' OR role = 'admin' LIMIT 1), NOW());

-- Confirm the data was inserted
SELECT 'News Articles:' as type, COUNT(*) as count FROM news_articles
UNION ALL
SELECT 'Sessions:', COUNT(*) FROM sessions;
