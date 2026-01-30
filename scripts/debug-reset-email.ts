
import { Resend } from 'resend';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function debugEmail() {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
        console.error("❌ RESEND_API_KEY missing");
        return;
    }

    const resend = new Resend(apiKey);
    const targetEmail = 'nicholasmacaskill@proton.me';
    const fromAddress = process.env.EMAIL_FROM || 'EAST Sports Group <onboarding@updates.eastsportsgroup.com>';

    console.log(`Test Sending to: ${targetEmail}`);
    console.log(`From: ${fromAddress}`);

    try {
        const { data, error } = await resend.emails.send({
            from: fromAddress,
            to: targetEmail,
            subject: 'Debug: Password Reset Test',
            html: '<p>This is a test email to verify delivery to Proton Mail headers.</p>'
        });

        if (error) {
            console.error('❌ Resend Error:', error);
        } else {
            console.log('✅ Email Sent. ID:', data?.id);
        }

    } catch (e: any) {
        console.error('❌ Exception:', e.message);
    }
}

debugEmail();
