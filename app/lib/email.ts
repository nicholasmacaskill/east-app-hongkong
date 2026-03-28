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
  cc?: string | string[]; // Added: CC support for Resend
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

/**
 * Wraps raw HTML content in the premium EAST App layout
 */
export function wrapEmailHtml(content: string, title?: string) {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${title || 'EAST App'}</title>
    </head>
    <body style="margin: 0; padding: 0; background-color: #0c0c0c; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased;">
        <div style="background-color: #0c0c0c; padding: 40px 20px;">
            <div style="max-width: 600px; margin: 0 auto; background-color: #000000; color: #ffffff; border-radius: 24px; overflow: hidden; border: 1px solid rgba(255, 255, 255, 0.05); box-shadow: 0 20px 40px rgba(0, 0, 0, 0.5);">
                <!-- Header / Logo Area -->
                <div style="padding: 40px 40px 20px 40px; text-align: left;">
                    <div style="display: inline-block;">
                        <img src="${BASE_URL}/east-logo-transparent.png" alt="EAST Logo" style="height: 64px; width: auto; display: block;" />
                    </div>
                </div>

                <!-- Main Content -->
                <div style="padding: 0 40px 40px 40px;">
                    ${content}
                </div>

                <!-- Footer -->
                <div style="padding: 30px 40px; background-color: #111111; border-top: 1px solid rgba(255, 255, 255, 0.05); text-align: left;">
                    <p style="margin: 0; font-size: 14px; color: #666666; line-height: 1.6;">
                        &copy; ${new Date().getFullYear()} EAST Sports Group. All rights reserved.<br/>
                        Hong Kong's Premier Athletic Training Platform.
                    </p>
                </div>
            </div>
            
            <div style="max-width: 600px; margin: 30px auto 0; text-align: center;">
                <p style="font-size: 12px; color: #888888;">
                    If you didn't expect this email, please ignore it.
                </p>
            </div>
        </div>
    </body>
    </html>
  `;
}

export async function sendEmail({ to, cc, subject, html, source }: EmailParams) {
  // 1. Wrap HTML if it's not already a full document
  const finalHtml = html.includes('<html') ? html : wrapEmailHtml(html, subject);

  // Log to database for testing (non-blocking)
  await logEmailToDatabase({ to, cc, subject, html: finalHtml, source });

  // Check for API Key first
  if (!process.env.RESEND_API_KEY) {
    if (process.env.NODE_ENV !== 'production') {
      console.warn('⚠️ [MOCK] RESEND_API_KEY missing in Non-Production. Simulating success.');
      return { id: 'mock-email-id' };
    }
    console.error('❌ RESEND_API_KEY is missing in PRODUCTION. Email failed.');
    return null;
  }

  // If we have a key, proceed to send
  if (process.env.NODE_ENV !== 'production') {
    console.log(`📧 [DEV LOG] Sending Real Email to: ${to}`);
    console.log(`Subject: ${subject}`);
    console.log(`HTML Preview: ${finalHtml.substring(0, 100)}...`);
  }

  try {
    const resend = new Resend(process.env.RESEND_API_KEY);
    const fromAddress = process.env.EMAIL_FROM || 'EAST Sports Group <onboarding@updates.eastsportsgroup.com>';

    const { data, error } = await resend.emails.send({
      from: fromAddress,
      to,
      cc, // Pass CC if provided
      subject,
      html: finalHtml,
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