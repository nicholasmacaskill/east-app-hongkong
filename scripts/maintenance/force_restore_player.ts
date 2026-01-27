import getDbPool from '../../app/lib/db';

const run = async () => {
    const pool = getDbPool();
    const client = await pool.connect();
    try {
        console.log('Forcefully restoring player@east.com...');

        // 1. Delete from profiles (using email to catch any ID mismatch)
        console.log('Cleaning profiles...');
        await client.query(`DELETE FROM public.profiles WHERE contact_email = 'player@east.com'`);

        // 2. Delete from auth.users
        console.log('Cleaning auth.users...');
        await client.query(`DELETE FROM auth.users WHERE email = 'player@east.com'`);

        // 3. Insert Auth User
        console.log('Inserting Auth User...');
        const userId = '11111111-1111-1111-1111-111111111111';
        await client.query(`
      INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, aud, role)
      VALUES (
        $1, 
        'player@east.com', 
        crypt('password123', gen_salt('bf')), 
        now(),
        '{"provider":"email","providers":["email"]}',
        '{"role":"player"}',
        'authenticated',
        'authenticated'
      )
    `, [userId]);

        // 4. Insert Profile (Manual insert to ensure fields are correct)
        console.log('Inserting Profile...');
        // Note: We use ON CONFLICT DO UPDATE just in case a trigger beat us to it
        await client.query(`
      INSERT INTO public.profiles (id, role, contact_email, first_name, last_name, credits, preferences, parent_id)
      VALUES (
        $1, 
        'player', 
        'player@east.com', 
        'Test', 
        'Player',
        100,
        '{}'::jsonb,
        NULL
      )
      ON CONFLICT (id) DO UPDATE 
      SET 
        role = 'player', 
        credits = 100,
        contact_email = 'player@east.com',
        first_name = 'Test',
        last_name = 'Player';
    `, [userId]);

        console.log('✅ player@east.com restored successfully.');

    } catch (e) {
        console.error('❌ Error restoring player:', e);
    } finally {
        client.release();
        await pool.end();
    }
};

run();
