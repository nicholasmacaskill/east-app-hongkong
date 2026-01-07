-- Update Session Costs (Jan 6, 2026)
-- Run this in the Supabase SQL Editor to update existing session pricing

-- 1. Golf Simulators (200 Credits)
UPDATE sessions 
SET credit_cost = 200 
WHERE title IN ('Golf Simulator - North Bay', 'Golf Simulator - South Bay');

-- 2. Shooting Bays (100 Credits)
UPDATE sessions 
SET credit_cost = 100 
WHERE title IN ('Shooting Bay - Blue Pad', 'Shooting Bay - Green Pad');

-- 3. Senior Coach Shooting (850 Credits)
-- Matches 'Shooting (Senior)' and specific coach descriptions if title varies
UPDATE sessions 
SET credit_cost = 850 
WHERE title LIKE 'Shooting (Senior)%';

-- 4. Junior Coach Shooting (500 Credits)
UPDATE sessions 
SET credit_cost = 500 
WHERE title LIKE 'Shooting (Junior)%';

-- 5. Personal Training (700 Credits)
UPDATE sessions 
SET credit_cost = 700 
WHERE title = 'Personal Training';
