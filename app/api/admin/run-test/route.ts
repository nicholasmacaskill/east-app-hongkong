import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/app/lib/supabaseAdmin';
import { exec } from 'child_process';
import { promisify } from 'util';

const execPromise = promisify(exec);

export async function POST(request: Request) {
    try {
        const { ticketId, testPath } = await request.json();

        // 1. AUTHENTICATION & ROLE CHECK
        const authHeader = request.headers.get('Authorization');
        if (!authHeader) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const supabaseAdmin = getSupabaseAdmin();
        const { data: { user } } = await supabaseAdmin.auth.getUser(authHeader.replace('Bearer ', ''));
        
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { data: profile } = await supabaseAdmin
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single();

        if (!profile || (profile.role !== 'admin' && profile.role !== 'sys-admin')) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        // 2. VALIDATE TEST PATH
        if (!testPath || !testPath.startsWith('tests/')) {
            return NextResponse.json({ error: 'Invalid test path' }, { status: 400 });
        }

        console.log(`[TEST RUNNER] Triggering test: ${testPath} for Ticket #${ticketId}`);

        // 3. EXECUTE PLAYWRIGHT (Async)
        const command = `npx playwright test ${testPath} --project=admin-chromium`;
        
        execPromise(command)
            .then(async ({ stdout }) => {
                console.log(`[TEST RUNNER] Test Complete for #${ticketId}`);
                const passed = stdout.includes('passed');
                const summary = passed
                    ? `✅ Passed: Automated verification confirmed the feature is functional and meets the definition of done. (Run: ${new Date().toLocaleString()})`
                    : `❌ Failed: Automated verification detected a regression or missing element. Manual review required. (Run: ${new Date().toLocaleString()})`;

                await supabaseAdmin
                    .from('engineering_tickets')
                    .update({ 
                        resolution: summary,
                        updated_at: new Date().toISOString()
                    })
                    .eq('id', ticketId);
            })
            .catch(async (error: any) => {
                console.error(`[TEST RUNNER] Test Crashed for #${ticketId}:`, error);
                const summary = `❌ Failed: Automated verification encountered an execution error. (Run: ${new Date().toLocaleString()})\nError: ${error.message.slice(0, 200)}`;

                await supabaseAdmin
                    .from('engineering_tickets')
                    .update({ 
                        resolution: summary,
                        updated_at: new Date().toISOString()
                    })
                    .eq('id', ticketId);
            });

        return NextResponse.json({ success: true, message: 'Test triggered' });

    } catch (error: any) {
        console.error('Run test API error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
