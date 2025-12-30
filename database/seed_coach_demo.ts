
import { Pool } from 'pg';
import fs from 'fs';
import path from 'path';

// Manual env load
try {
    const envPath = path.resolve(process.cwd(), '.env.local');
    if (fs.existsSync(envPath)) {
        const envConfig = fs.readFileSync(envPath, 'utf8');
        envConfig.split('\n').forEach(line => {
            const parts = line.split('=');
            if (parts.length >= 2) {
                const key = parts[0].trim();
                const value = parts.slice(1).join('=').trim().replace(/(^"|"$)/g, '');
                if (key && !key.startsWith('#')) {
                    process.env[key] = value;
                }
            }
        });
    }
} catch (e) {
    console.log("Could not read .env.local");
}

async function createDemoData() {
    const dbPort = process.env.DB_PORT || '54322';
    const config = {
        host: process.env.DB_HOST || '127.0.0.1',
        user: process.env.DB_USER || 'postgres',
        password: process.env.DB_PASSWORD || 'postgres',
        database: process.env.DB_NAME || 'postgres',
        port: parseInt(dbPort, 10),
    };

    const pool = new Pool(config);
    const coachId = '722deeb8-289b-4652-9acb-f8e854cfbaf1';

    try {
        console.log("Clearing old availability...");
        await pool.query("DELETE FROM availability WHERE coach_id = $1", [coachId]);

        console.log("Adding new availability slots...");
        const today = new Date();

        // Create slots for tomorrow and next day
        const slots = [
            { d: 1, h: 9, m: 0, dur: 60 },
            { d: 1, h: 14, m: 0, dur: 90 },
            { d: 2, h: 10, m: 0, dur: 60 },
            { d: 2, h: 16, m: 0, dur: 60 }
        ];

        for (const s of slots) {
            const start = new Date(today);
            start.setDate(today.getDate() + s.d);
            start.setHours(s.h, s.m, 0, 0);

            const end = new Date(start);
            end.setMinutes(start.getMinutes() + s.dur);

            await pool.query(
                "INSERT INTO availability (coach_id, start_time, end_time, status) VALUES ($1, $2, $3, 'available')",
                [coachId, start.toISOString(), end.toISOString()]
            );
        }

        console.log("Updating gallery with high-fidelity images...");
        const gallery = [
            "https://images.unsplash.com/photo-1580748141549-71748ddf0bdc?auto=format&fit=crop&q=80&w=800",
            "https://images.unsplash.com/photo-1546519638-68e109498ffc?auto=format&fit=crop&q=80&w=800",
            "https://images.unsplash.com/photo-1518407613690-d9fc996e74bc?auto=format&fit=crop&q=80&w=800",
            "https://images.unsplash.com/photo-1517649763962-0c623066013b?auto=format&fit=crop&q=80&w=800",
            "https://images.unsplash.com/photo-1579952363873-27f3bade9f55?auto=format&fit=crop&q=80&w=800"
        ];

        // Important: Use unquoted string for the array literal if not using parameterized array
        // Or simpler: use JSON string since it's a JSONB column (wait, it might be a text array in Supabase)
        // Looking at information_schema: it didn't show gallery_images type clearly for profiles, but usually it's text[] or jsonb.
        // Let's use parameterized query which handles arrays well for pg.
        await pool.query(
            "UPDATE profiles SET gallery_images = $1 WHERE id = $2",
            [gallery, coachId]
        );

        console.log("✅ Demo data created successfully.");
    } catch (err: any) {
        console.error("❌ Failed to create demo data:", err.message);
    } finally {
        await pool.end();
    }
}

createDemoData();
