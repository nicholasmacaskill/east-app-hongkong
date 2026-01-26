-- Create a debug table to track webhook attempts
CREATE TABLE IF NOT EXISTS webhook_debug_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    event_type TEXT,
    payload JSONB,
    status TEXT,
    error_message TEXT
);

-- Enable RLS but allow public insert for now (or just service role)
ALTER TABLE webhook_debug_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow Service Role Full Access" ON webhook_debug_logs
    USING (true)
    WITH CHECK (true);
