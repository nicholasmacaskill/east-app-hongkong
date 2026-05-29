require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');

async function run() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error('No DATABASE_URL found!');
    process.exit(1);
  }

  const pool = new Pool({
    connectionString: connectionString,
    ssl: { rejectUnauthorized: false }
  });

  const sql = `
  CREATE TABLE IF NOT EXISTS public.check_ins (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
    location_id text NOT NULL,
    created_at timestamptz DEFAULT now()
  );

  ALTER TABLE public.check_ins ENABLE ROW LEVEL SECURITY;

  DROP POLICY IF EXISTS "Users can view their own check-ins" ON public.check_ins;
  CREATE POLICY "Users can view their own check-ins"
    ON public.check_ins FOR SELECT
    USING (auth.uid() = user_id);

  DROP POLICY IF EXISTS "Admins can view all check-ins" ON public.check_ins;
  CREATE POLICY "Admins can view all check-ins"
    ON public.check_ins FOR SELECT
    USING (
      EXISTS (
        SELECT 1 FROM public.profiles
        WHERE profiles.id = auth.uid() AND (profiles.role = 'admin' OR profiles.role = 'sys-admin')
      )
    );

  GRANT ALL ON TABLE public.check_ins TO service_role;
  GRANT SELECT ON TABLE public.check_ins TO authenticated;
  `;

  console.log('Running schema creation...');
  try {
    await pool.query(sql);
    console.log('✅ Success! Schema updated.');
  } catch (err) {
    console.error('Error executing schema:', err);
  } finally {
    await pool.end();
  }
}

run();
