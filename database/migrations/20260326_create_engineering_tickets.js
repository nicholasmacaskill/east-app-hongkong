const { createClient } = require('@supabase/supabase-js');
const path = require('path');
const fs = require('fs');

function loadEnv() {
    const envPath = path.resolve(process.cwd(), '.env.local');
    if (fs.existsSync(envPath)) {
        const envConfig = fs.readFileSync(envPath, 'utf8');
        envConfig.split('\n').forEach(line => {
            const parts = line.split('=');
            if (parts.length >= 2) {
                const key = parts[0].trim();
                const value = parts.slice(1).join('=').trim().replace(/(^"|"$)/g, '');
                if (key && !key.startsWith('#')) {
                    process.env[key] = value;
                }
            }
        });
    }
}

loadEnv();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, serviceRoleKey);

async function runMigration() {
    console.log('🚀 Migration: Create Engineering Tickets Table');

    const sql = `
-- 1. Create the table
CREATE TABLE IF NOT EXISTS public.engineering_tickets (
    id SERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    status TEXT DEFAULT 'open', -- open, in_progress, verify, done, blocked
    priority TEXT DEFAULT 'medium', -- low, medium, high, critical
    category TEXT DEFAULT 'bug', -- bug, feature, ui, infrastructure
    reporter_id UUID REFERENCES public.profiles(id),
    assigned_agent TEXT DEFAULT 'Antigravity',
    test_branch TEXT,
    test_url TEXT,
    coo_approval BOOLEAN DEFAULT FALSE,
    ceo_approval BOOLEAN DEFAULT FALSE,
    screenshot_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Add updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_engineering_tickets_updated_at') THEN
        CREATE TRIGGER update_engineering_tickets_updated_at
        BEFORE UPDATE ON public.engineering_tickets
        FOR EACH ROW
        EXECUTE PROCEDURE update_updated_at_column();
    END IF;
END $$;

-- 3. Security: Enable RLS
ALTER TABLE public.engineering_tickets ENABLE ROW LEVEL SECURITY;

-- 4. Policies: Sys-Admin and Coach only
-- Sys-Admins have full access
CREATE POLICY "Sys-Admins have full access to tickets" 
ON public.engineering_tickets
FOR ALL 
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE profiles.id = auth.uid() AND profiles.role = 'sys-admin'
    )
);

-- Coaches can view and create, but not delete
CREATE POLICY "Coaches can view and create tickets" 
ON public.engineering_tickets
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE profiles.id = auth.uid() AND profiles.role IN ('sys-admin', 'coach')
    )
);

CREATE POLICY "Coaches can insert tickets" 
ON public.engineering_tickets
FOR INSERT
TO authenticated
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE profiles.id = auth.uid() AND profiles.role IN ('sys-admin', 'coach')
    )
);

-- 5. Grant access to service_role (for agentic verification)
GRANT ALL ON public.engineering_tickets TO service_role;
GRANT SELECT, INSERT, UPDATE ON public.engineering_tickets TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE public.engineering_tickets_id_seq TO authenticated;

-- 6. Create storage bucket for screenshots (if not exists)
INSERT INTO storage.buckets (id, name, public)
VALUES ('ticket-attachments', 'ticket-attachments', true)
ON CONFLICT (id) DO NOTHING;

-- 7. Storage policies for ticket attachments
CREATE POLICY "Authenticated users can upload ticket attachments"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'ticket-attachments');

CREATE POLICY "Anyone can view ticket attachments"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'ticket-attachments');
`;

    console.log('📡 Sending migration to Supabase...');
    const { error } = await supabase.rpc('run_sql', { sql_query: sql });

    if (error) {
        console.error('❌ Migration Failed:', JSON.stringify(error, null, 2));
        process.exit(1);
    }

    console.log('✅ Engineering Tickets table created successfully!');
}

runMigration();
