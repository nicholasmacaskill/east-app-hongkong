import { Client } from 'pg';

const JRDUCKS_DB_CONFIG = {
  host: process.env.DB_HOST || 'db.hzltndrltyseifwbmjeg.supabase.co',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: 'postgres',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || process.env.DATABASE_PASSWORD,
  ssl: { rejectUnauthorized: false }
};

async function addSessionsStatus() {
  console.log('🦆 Connecting to Jr. Ducks database...');
  const client = new Client(JRDUCKS_DB_CONFIG);
  await client.connect();

  try {
    console.log('Adding status column to sessions table...');
    await client.query(`
      ALTER TABLE public.sessions 
      ADD COLUMN IF NOT EXISTS status text DEFAULT 'active';
    `);

    console.log('Setting all active sessions to status = active...');
    await client.query(`
      UPDATE public.sessions 
      SET status = 'active' 
      WHERE status IS NULL;
    `);

    console.log('Reloading PostgREST schema cache...');
    await client.query(`NOTIFY pgrst, 'reload schema';`);

    console.log('✅ Successfully added and activated status column on sessions table!');
  } catch (err: any) {
    console.error('❌ Migration failed:', err.message);
    throw err;
  } finally {
    await client.end();
  }
}

addSessionsStatus().catch(err => {
  console.error(err);
  process.exit(1);
});
