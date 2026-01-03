
import getDbPool from '../app/lib/db';

const sql = `
  CREATE TABLE IF NOT EXISTS public.check_ins (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    location_id text NOT NULL,
    created_at timestamptz DEFAULT now()
  );

  -- RLS
  ALTER TABLE public.check_ins ENABLE ROW LEVEL SECURITY;

  CREATE POLICY "Users can view their own check-ins"
    ON public.check_ins FOR SELECT
    USING (auth.uid() = user_id);

  CREATE POLICY "Admins can view all check-ins"
    ON public.check_ins FOR SELECT
    USING (
      EXISTS (
        SELECT 1 FROM public.profiles
        WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
      )
    );

  -- Only service role (backend API) needs to insert for now, 
  -- or we allow authenticated users to insert if we trust the client (we don't for check-ins usually).
  -- Let's assume the API handles the insertion using service key for security/validation, 
  -- OR if sticking to Supabase RLS, we allow insert with valid fields.
  -- For this "Real QR System", the plan says "Backend API validates... and records".
  -- So API will use Service Role or we can just Grant Insert to service_role.

  GRANT ALL ON TABLE public.check_ins TO service_role;
  GRANT SELECT ON TABLE public.check_ins TO authenticated;
`;

(async () => {
    const pool = getDbPool();
    const client = await pool.connect();
    try {
        console.log("🚀 Running Migration: Create check_ins table...");
        await client.query(sql);
        console.log("✅ Success: Table created and policies set.");
    } catch (e) {
        console.error("❌ Migration Failed:", e);
    } finally {
        client.release();
        await pool.end();
    }
})();
