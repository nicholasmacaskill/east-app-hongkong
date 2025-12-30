
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

async function fixCoaches() {
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
        const gallery = [
            "https://images.unsplash.com/photo-1580748141549-71748ddf0bdc?auto=format&fit=crop&q=80&w=800",
            "https://images.unsplash.com/photo-1546519638-68e109498ffc?auto=format&fit=crop&q=80&w=800",
            "https://images.unsplash.com/photo-1518407613690-d9fc996e74bc?auto=format&fit=crop&q=80&w=800",
            "https://images.unsplash.com/photo-1517649763962-0c623066013b?auto=format&fit=crop&q=80&w=800",
            "https://images.unsplash.com/photo-1579952363873-27f3bade9f55?auto=format&fit=crop&q=80&w=800"
        ];

        console.log("Applying high-fidelity gallery and removing submitted video for ALL coaches...");
        // Update all coaches to ensure they have high fidelity content
        await pool.query(
            "UPDATE profiles SET gallery_images = $1, intro_video_url = NULL WHERE role = 'coach'",
            [gallery]
        );

        console.log("✅ Coaches updated successfully.");
    } catch (err: any) {
        console.error("❌ Failed to update coaches:", err.message);
    } finally {
        await pool.end();
    }
}

fixCoaches();
