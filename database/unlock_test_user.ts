
import * as dotenv from 'dotenv';
import path from 'path';
import { Pool } from 'pg';

// Load .env.local from the project root
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

async function unlockTestUser() {
    const email = 'penalty-verify-1770238636132@example.com';
    console.log(`🔍 Unlocking membership for: ${email}`);

    const connectionString = process.env.DATABASE_URL;

    if (!connectionString) {
        console.error("❌ DATABASE_URL is not defined in .env.local");
        return;
    }

    const pool = new Pool({
        connectionString: connectionString,
        ssl: { rejectUnauthorized: false }
    });

    const client = await pool.connect();

    try {
        const now = new Date();
        const expiry = new Date();
        expiry.setDate(now.getDate() + 30);

        console.log("Updating profile columns...");
        const res = await client.query(`
            UPDATE public.profiles 
            SET 
                membership_start = $1,
                membership_expires = $2,
                account_status = 'active',
                subscription_status = 'active',
                membership_tier = 'individual'
            WHERE contact_email = $3
            RETURNING id, contact_email, account_status, membership_expires
        `, [now.toISOString(), expiry.toISOString(), email]);

        if (res.rowCount === 0) {
            console.log(`❌ No profile found with email: ${email}`);
        } else {
            console.log("✅ Profile updated successfully:");
            console.table(res.rows);
        }
    } catch (err) {
        console.error("❌ Error updating profile:", err);
    } finally {
        client.release();
        await pool.end();
    }
}

unlockTestUser();
