const { Pool } = require('pg');

const getDbPool = () => {
    return new Pool({
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '54322', 10),
        user: process.env.DB_USER || 'postgres',
        password: process.env.DB_PASSWORD || 'postgres',
        database: process.env.DB_NAME || 'postgres',
    });
};

const COACH_ID = '722deeb8-289b-4652-9acb-f8e854cfbaf1';

const sql = `
DO $$
DECLARE
    day_offset INT;
    base_date TIMESTAMP;
BEGIN
    -- Clear existing availability for this coach to avoid dupes
    DELETE FROM public.availability WHERE coach_id = '${COACH_ID}';

    -- Loop for 30 days
    FOR day_offset IN 0..30 LOOP
        base_date := DATE_TRUNC('day', NOW() + (day_offset || ' days')::INTERVAL);
        
        -- Insert generic 9am to 6pm availability for each day
        INSERT INTO public.availability(coach_id, start_time, end_time, status)
        VALUES (
            '${COACH_ID}',
            base_date + INTERVAL '09:00:00',
            base_date + INTERVAL '18:00:00',
            'available'
        );
    END LOOP;
END $$;
`;

(async () => {
    const pool = getDbPool();
    const client = await pool.connect();
    try {
        console.log("🕒 Seeding Coach Availability...");
        await client.query(sql);
        console.log("✅ Success: Added 30 days of availability for Coach ID:", COACH_ID);
    } catch (e) {
        console.error("❌ Seeding Failed:", e);
    } finally {
        client.release();
        await pool.end();
    }
})();
