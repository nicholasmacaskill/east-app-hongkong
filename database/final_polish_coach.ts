
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

async function finalize() {
    const dbPort = process.env.DB_PORT || '54322';
    const config = {
        host: process.env.DB_HOST || '127.0.0.1',
        user: process.env.DB_USER || 'postgres',
        password: process.env.DB_PASSWORD || 'postgres',
        database: process.env.DB_NAME || 'postgres',
        port: parseInt(dbPort, 10),
    };

    const pool = new Pool(config);

    try {
        const basketballImg = "https://images.unsplash.com/photo-1546519638-68e109498ffc?auto=format&fit=crop&q=80&w=800";
        const gallery = [basketballImg, basketballImg, basketballImg];

        console.log("Updating all coaches to use triple basketball photos and clearing video...");
        await pool.query(
            "UPDATE profiles SET gallery_images = $1, intro_video_url = NULL WHERE role = 'coach'",
            [gallery]
        );

        console.log("Requesting schema reload...");
        await pool.query("NOTIFY pgrst, 'reload schema';");

        console.log("✅ Final polish applied successfully.");
    } catch (err: any) {
        console.error("❌ Final polish failed:", err.message);
    } finally {
        await pool.end();
    }
}

finalize();
