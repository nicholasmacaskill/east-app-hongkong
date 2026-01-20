import { Client } from 'pg';

async function migrate() {
    console.log('🚀 Starting Coach Notes Schema Migration (Direct PG)...');

    const config = {
        host: 'aws-0-us-west-2.pooler.supabase.com',
        port: 6543,
        user: 'postgres.hxbsnplotkiohcbmvsjf',
        password: 'Uninsured5-Unissued6-Happier7-Dripping1-Bubbling8',
        database: 'postgres',
        ssl: {
            rejectUnauthorized: false
        }
    };

    const client = new Client(config);

    try {
        await client.connect();
        console.log('✅ Connected to Postgres.');

        const sql = `
            -- 1. Create coach_notes table
            CREATE TABLE IF NOT EXISTS public.coach_notes (
                id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
                coach_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
                player_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
                content text NOT NULL,
                created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
            );

            -- 2. Enable RLS
            ALTER TABLE public.coach_notes ENABLE ROW LEVEL SECURITY;

            -- 3. Drop existing policies to avoid conflicts if re-run
            DROP POLICY IF EXISTS "Coaches can manage own notes" ON public.coach_notes;
            DROP POLICY IF EXISTS "Admins can view all notes" ON public.coach_notes;

            -- 4. Create Policies
            -- Coaches can manage their own notes
            CREATE POLICY "Coaches can manage own notes" ON public.coach_notes
                FOR ALL USING (auth.uid() = coach_id);

            -- Admins can view all notes (role check)
            CREATE POLICY "Admins can view all notes" ON public.coach_notes
                FOR SELECT USING (
                    EXISTS (
                        SELECT 1 FROM public.profiles
                        WHERE id = auth.uid() AND (role = 'admin' OR role = 'sys-admin')
                    )
                );
        `;

        console.log('📝 Applying SQL migration...');
        await client.query(sql);
        console.log('✅ Coach Notes Schema Migration Successful!');

    } catch (err: any) {
        console.error('❌ Migration Failed:', err.message);
        process.exit(1);
    } finally {
        await client.end();
    }
}

migrate().catch((err) => {
    console.error('💥 Unexpected Error:', err);
    process.exit(1);
});
