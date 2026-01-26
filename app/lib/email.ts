// app/lib/email.ts
import { Resend } from 'resend';
import { getSupabaseAdmin } from './supabaseAdmin';

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
  source?: string; // Optional: track where the email came from (e.g., 'booking', 'password-reset')
}

// Log email to database for Playwright testing
async function logEmailToDatabase(params: EmailParams) {
  if (process.env.LOG_EMAILS_TO_DB !== 'true') {
    return; // Skip if not enabled
  }

  try {
    const supabaseAdmin = getSupabaseAdmin();
    await supabaseAdmin.from('test_emails').insert({
      to_address: params.to,
      subject: params.subject,
      html_body: params.html,
      trigger_source: params.source || 'unknown',
    });
  } catch (err) {
    console.error('Failed to log email to database:', err);
    // Don't fail the email send if logging fails
  }
}

export async function sendEmail({ to, subject, html, source }: EmailParams) {
  // Log to database for testing (non-blocking)
  await logEmailToDatabase({ to, subject, html, source });

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
    const fromAddress = process.env.EMAIL_FROM || 'EAST Training <onboarding@eastsportsgroup.com>';

    const { data, error } = await resend.emails.send({
      from: fromAddress,
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