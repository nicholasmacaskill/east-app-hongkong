
import getDbPool from '../../app/lib/db';

const run = async () => {
    const pool = getDbPool();
    const client = await pool.connect();
    try {
        console.log("Checking testuser role...");
        const res = await client.query("SELECT id, email, role FROM auth.users WHERE email = 'testuser@example.com'");
        console.log("Auth User:", res.rows[0]);

        if (res.rows.length > 0) {
            const userId = res.rows[0].id;
            const profileRes = await client.query("SELECT id, role, first_name FROM profiles WHERE id = $1", [userId]);
            console.log("Profile:", profileRes.rows[0]);
        }
    } catch (e) {
        console.error(e);
    } finally {
        client.release();
        await pool.end();
    }
};

run();
