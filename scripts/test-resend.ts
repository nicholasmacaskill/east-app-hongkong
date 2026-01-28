
import { Resend } from 'resend';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function testResend() {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
        console.error("❌ RESEND_API_KEY missing in .env.local");
        return;
    }

    console.log("Testing Resend API Key:", apiKey.substring(0, 7) + "...");
    const resend = new Resend(apiKey);

    try {
        const { data, error } = await resend.emails.send({
            from: 'EAST Training <onboarding@updates.eastsportsgroup.com>',
            to: 'delivered@resend.dev',
            subject: 'System Audit - Resend Verification',
            html: '<p>Resend key integration is working correctly.</p>'
        });

        if (error) {
            console.error("❌ Resend API Error:", error);
            if (error.name === 'validation_error' && error.message.includes('domain')) {
                console.warn("⚠️  Domain Verification Issue: onboarding@eastsportsgroup.com may not be verified yet.");
            }
        } else {
            console.log("✅ Resend Success! Message ID:", data?.id);
        }
    } catch (err: any) {
        console.error("❌ Code Crash during send:", err.message);
    }
}

testResend();
