import getDbPool from '../app/lib/db';

const run = async () => {
    const pool = getDbPool();
    const client = await pool.connect();
    try {
        console.log('Restoring player@east.com...');

        const userId = '11111111-1111-1111-1111-111111111111';

        // Cleanup first
        await client.query(`DELETE FROM public.profiles WHERE id = $1`, [userId]);
        await client.query(`DELETE FROM auth.users WHERE id = $1`, [userId]);

        // Insert Auth User
        await client.query(`
      INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data)
      VALUES (
        $1, 
        'player@east.com', 
        crypt('password123', gen_salt('bf')), 
        now(),
        '{"provider":"email","providers":["email"]}',
        '{"role":"player"}'
      )
    `, [userId]);

        // Insert Profile
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
    `, [userId]);

        console.log('✅ player@east.com restored.');

    } catch (e) {
        console.error('Error:', e);
    } finally {
        client.release();
        await pool.end();
    }
};

run();
