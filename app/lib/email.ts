// app/lib/email.ts
import { Resend } from 'resend';

// Initialize Resend with the key from env.local
// const resend = new Resend(process.env.RESEND_API_KEY); (Lazy init below)

// Helper for Base URL to prevent malformed links
export const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://MISSING-BASE-URL';

if (!process.env.NEXT_PUBLIC_BASE_URL) {
  console.warn('⚠️ NEXT_PUBLIC_BASE_URL is missing. Email links may be broken.');
}

interface EmailParams {
  to: string;
  subject: string;
  html: string;
}

export async function sendEmail({ to, subject, html }: EmailParams) {
  // Check for API Key first
  if (!process.env.RESEND_API_KEY) {
    if (process.env.NODE_ENV !== 'production') {
      console.warn('⚠️ [MOCK] RESEND_API_KEY missing in Non-Production. Simulating success.');
      return { id: 'mock-email-id' }; // Corrected typo: mock-emai-id -> mock-email-id
    }
    console.error('❌ RESEND_API_KEY is missing in PRODUCTION. Email failed.');
    return null;
  }

  // If we have a key, proceed to send
  if (process.env.NODE_ENV !== 'production') {
    console.log(`📧 [DEV LOG] Sending Real Email to: ${to}`);
    console.log(`Subject: ${subject}`);
    console.log(`HTML Preview: ${html.substring(0, 100)}...`);
  }

  try {
    const resend = new Resend(process.env.RESEND_API_KEY);

    const { data, error } = await resend.emails.send({
      from: 'EAST Training <onboarding@resend.dev>',
      to,
      subject,
      html,
    });

    // ✅ FIX: Check for API-level errors (like invalid email, domain issues)
    if (error) {
      console.error('❌ Resend API Error:', error);

      // FALLBACK: If API key is invalid in DEV, mock success
      if (process.env.NODE_ENV !== 'production' && (error.statusCode === 401 || error.message?.includes('API key'))) {
        console.warn('⚠️ [MOCK] Resend Key Invalid in Dev. Simulating success.');
        return { success: true, data: { id: 'mock-fallback-id' } };
      }

      return { success: false, error: error };
    }

    console.log(`📧 Email sent to ${to}:`, data);
    return { success: true, data };

  } catch (error: any) {
    // This catches network errors or code crashes
    console.error('❌ Unexpected Error sending email:', error);
    return { success: false, error: error.message };
  }
}