-- Add priority column to sessions table for News/Event ordering
-- Default is 0. Higher values will be displayed first.

ALTER TABLE public.sessions 
ADD COLUMN IF NOT EXISTS priority INTEGER DEFAULT 0;

COMMENT ON COLUMN public.sessions.priority IS 'Ordering priority for news/events. Higher values shown first.';
