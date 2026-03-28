-- Add playwright_test column to engineering_tickets table
ALTER TABLE engineering_tickets ADD COLUMN IF NOT EXISTS playwright_test TEXT;
