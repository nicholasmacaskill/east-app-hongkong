import getDbPool from './app/lib/db';

const run = async () => {
    const pool = getDbPool();
    const client = await pool.connect();
    try {
        console.log('Restoring player@east.com...');

        // Create auth user
        await client.query(`
      INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data)
      VALUES (
        '11111111-1111-1111-1111-111111111111', 
        'player@east.com', 
        crypt('password123', gen_salt('bf')), 
        now(),
        '{"provider":"email","providers":["email"]}',
        '{"role":"player"}'
      )
      ON CONFLICT (email) DO NOTHING;
    `);

        // Upsert profile
        await client.query(`
      INSERT INTO public.profiles (id, role, contact_email, first_name, last_name, credits)
      VALUES (
        '11111111-1111-1111-1111-111111111111', 
        'player', 
        'player@east.com', 
        'Test', 
        'Player',
        100
      )
      ON CONFLICT (id) DO UPDATE 
      SET role = 'player', credits = 100;
    `);

        console.log('✅ player@east.com restored.');

    } catch (e) {
        console.error('Error:', e);
    } finally {
        client.release();
        await pool.end();
    }
};

run();
