
import * as dotenv from 'dotenv';
import * as path from 'path';
import { Client } from 'pg';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const sql = `
  -- Create the portal tickets table
  CREATE TABLE IF NOT EXISTS public.po_portal_tickets (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    title text NOT NULL,
    whatsapp_text text,
    technical_spec jsonb DEFAULT '{}'::jsonb,
    status text DEFAULT 'Suggested' CHECK (status IN ('Suggested', 'Technical Review', 'Approved', 'In Progress', 'Done', 'Rejected')),
    rejection_reason text,
    ai_memory_summary text,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL
  );

  -- Enable RLS
  ALTER TABLE public.po_portal_tickets ENABLE ROW LEVEL SECURITY;

  -- sys-admin role can do Everything
  DO $$ 
  BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'po_portal_tickets' AND policyname = 'Admins have full access to portal tickets') THEN
      CREATE POLICY "Admins have full access to portal tickets"
        ON public.po_portal_tickets
        FOR ALL
        TO authenticated
        USING (
          EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid() AND (profiles.role = 'sys-admin' OR profiles.role = 'admin')
          )
        )
        WITH CHECK (
          EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid() AND (profiles.role = 'sys-admin' OR profiles.role = 'admin')
          )
        );
    END IF;
  END $$;

  -- Trigger to update updated_at
  CREATE OR REPLACE FUNCTION update_updated_at_column()
  RETURNS TRIGGER AS $$
  BEGIN
      NEW.updated_at = now();
      RETURN NEW;
  END;
  $$ language 'plpgsql';

  DROP TRIGGER IF EXISTS update_po_portal_tickets_updated_at ON public.po_portal_tickets;
  CREATE TRIGGER update_po_portal_tickets_updated_at
  BEFORE UPDATE ON public.po_portal_tickets
  FOR EACH ROW
  EXECUTE PROCEDURE update_updated_at_column();

  -- Grant access
  GRANT ALL ON TABLE public.po_portal_tickets TO service_role;
  GRANT SELECT, INSERT, UPDATE ON TABLE public.po_portal_tickets TO authenticated;
`;

(async () => {
    const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL;
    
    if (!connectionString) {
        console.error("❌ Error: No DATABASE_URL found in .env.local");
        process.exit(1);
    }

    const client = new Client({
        connectionString,
        ssl: { rejectUnauthorized: false }
    });

    try {
        console.log("🚀 Connecting to database for PO Portal migration...");
        await client.connect();
        console.log("🚀 Running Migration: Create po_portal_tickets table...");
        await client.query(sql);
        console.log("✅ Success: PO Portal table created and secured.");
    } catch (e) {
        console.error("❌ Migration Failed:", e);
        process.exit(1);
    } finally {
        await client.end();
    }
})();
