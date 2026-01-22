import getDbPool from '../app/lib/db';
import fs from 'fs';
import path from 'path';

// Helper to load .env.local if not loaded automatically
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
    console.error("Failed to load .env.local", e);
}

async function runMigration() {
    console.log('🌱 Seeding session_types with Core Services...');

    const pool = getDbPool();
    const client = await pool.connect();

    try {
        // 1. Create Table
        console.log('1. Ensuring session_types table exists...');
        await client.query(`
            CREATE TABLE IF NOT EXISTS public.session_types (
                id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
                title TEXT NOT NULL,
                category TEXT NOT NULL CHECK (category IN ('CLASS', 'PRIVATE', 'FACILITY')),
                image_url TEXT,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
            );
        `);

        // 2. Enable RLS
        console.log('2. Enabling RLS...');
        await client.query(`ALTER TABLE public.session_types ENABLE ROW LEVEL SECURITY;`);

        // 3. Add Policies (Simple Public Read)
        // We use a simple query that suppresses errors if policy exists, or we check first. 
        // Postgres doesn't have "CREATE POLICY IF NOT EXISTS".
        // Catching specific error 42710 (duplicate_object) is cleanest implementation.
        console.log('3. Setting up policies...');
        try {
            await client.query(`CREATE POLICY "Public Read Session Types" ON public.session_types FOR SELECT USING (true);`);
        } catch (e: any) {
            if (e.code !== '42710') console.warn('Policy creation warning (Public Read):', e.message);
        }

        try {
            await client.query(`
                CREATE POLICY "Admin All Session Types" ON public.session_types FOR ALL USING (
                    exists (select 1 from public.profiles where id = auth.uid() and role = 'sys-admin')
                );
            `);
        } catch (e: any) {
            if (e.code !== '42710') console.warn('Policy creation warning (Admin):', e.message);
        }

        // 4. Add Description Column
        console.log('4. Adding description column if missing...');
        try {
            await client.query(`ALTER TABLE public.session_types ADD COLUMN description TEXT;`);
        } catch (e: any) {
            // 42701 = duplicate_column
            if (e.code !== '42701') {
                console.error('Failed to add description column:', e);
                throw e;
            }
        }

        // 5. Insert Data
        console.log('5. Inserting core services...');
        const services = [
            {
                title: 'Facility',
                category: 'FACILITY',
                description: 'Access our high-performance facility and equipment.',
                image_url: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800'
            },
            {
                title: 'Class',
                category: 'CLASS',
                description: 'Group training sessions led by expert instructors.',
                image_url: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=800'
            },
            {
                title: 'Private Session',
                category: 'PRIVATE',
                description: '1-on-1 personalized coaching and instruction.',
                image_url: 'https://images.unsplash.com/photo-1544367563-12123d832e30?w=800'
            }
        ];

        for (const s of services) {
            await client.query(`
                INSERT INTO public.session_types (title, category, description, image_url)
                SELECT $1, $2, $3, $4
                WHERE NOT EXISTS (
                    SELECT 1 FROM public.session_types WHERE title = $1
                );
            `, [s.title, s.category, s.description, s.image_url]);
        }

        console.log('✅ Seeding successful!');

    } catch (err) {
        console.error('❌ Seeding failed:', err);
        process.exit(1);
    } finally {
        client.release();
        await pool.end();
    }
}

runMigration();
