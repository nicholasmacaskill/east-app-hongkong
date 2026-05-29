import { Pool } from 'pg';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.production.local') });

const connectionString = process.env.DATABASE_URL;

const pool = new Pool({
    connectionString,
    ssl: { rejectUnauthorized: false }
});

async function runMigration() {
    const client = await pool.connect();
    try {
        console.log("Connected. Fixing RLS for messages table...");

        await client.query(`
            ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
            
            DROP POLICY IF EXISTS "Users can view sent messages" ON public.messages;
            DROP POLICY IF EXISTS "Users can view received messages" ON public.messages;
            DROP POLICY IF EXISTS "Users can send messages" ON public.messages;
            DROP POLICY IF EXISTS "Users can delete sent messages" ON public.messages;
            DROP POLICY IF EXISTS "Team members can view team messages" ON public.messages;
            DROP POLICY IF EXISTS "Team members can send team messages" ON public.messages;
            
            -- View Direct Messages
            CREATE POLICY "Users can view sent messages"
            ON public.messages FOR SELECT
            USING (auth.uid() = sender_id);

            CREATE POLICY "Users can view received messages"
            ON public.messages FOR SELECT
            USING (auth.uid() = receiver_id);
            
            -- View Team Messages
            CREATE POLICY "Team members can view team messages"
            ON public.messages FOR SELECT
            USING (
                team_id IS NOT NULL AND 
                EXISTS (
                    SELECT 1 FROM team_members 
                    WHERE team_members.team_id = messages.team_id 
                    AND team_members.user_id = auth.uid()
                )
            );

            -- Send Direct & Team Messages
            CREATE POLICY "Users can send messages"
            ON public.messages FOR INSERT
            WITH CHECK (auth.uid() = sender_id);

            -- Delete sent messages
            CREATE POLICY "Users can delete sent messages"
            ON public.messages FOR DELETE
            USING (auth.uid() = sender_id);
        `);

        console.log("✅ Fixed RLS for messages.");
        
        await client.query(`NOTIFY pgrst, 'reload schema'`);
    } catch (err) {
        console.error("Migration error:", err);
    } finally {
        client.release();
        await pool.end();
    }
}

runMigration();
