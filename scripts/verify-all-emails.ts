
import { sendEmail } from '../app/lib/email';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function verifyAllEmailPaths() {
    const testEmail = 'delivered@resend.dev';

    const paths = [
        { source: 'welcome', subject: 'Welcome Email Path' },
        { source: 'booking', subject: 'Booking Confirmation Path' },
        { source: 'cancellation', subject: 'Cancellation Path' },
        { source: 'payment', subject: 'Stripe Payment Path' },
        { source: 'reminder', subject: 'Session Reminder Path' },
        { source: 'reset', subject: 'Password Reset Path' },
        { source: 'provision', subject: 'Player Provisioning Path' }
    ];

    console.log(`🚀 Starting Comprehensive Email Path Verification...`);
    console.log(`Using target email: ${testEmail}\n`);

    for (const p of paths) {
        console.log(`--- Testing Path: ${p.source} ---`);
        try {
            const result = await sendEmail({
                to: testEmail,
                subject: `System Test: ${p.subject}`,
                html: `<p>This is a test of the <strong>${p.source}</strong> email path.</p>`,
                source: p.source
            });

            if (result?.success) {
                console.log(`✅ Success! ID: ${result.data?.id}`);
            } else {
                console.error(`❌ Failed:`, result?.error);
            }
        } catch (err: any) {
            console.error(`🔥 Crash:`, err.message);
        }
        console.log('');
    }

    console.log(`🏁 Verification Complete.`);
}

verifyAllEmailPaths();
