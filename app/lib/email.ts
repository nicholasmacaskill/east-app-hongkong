// app/lib/email.ts
import { Resend } from 'resend';

// Initialize Resend with the key from env.local
const resend = new Resend(process.env.RESEND_API_KEY);

interface EmailParams {
  to: string;
  subject: string;
  html: string;
}

export async function sendEmail({ to, subject, html }: EmailParams) {
  if (!process.env.RESEND_API_KEY) {
    console.warn('⚠️ RESEND_API_KEY is missing. Email not sent.');
    return null;
  }

  try {
    // ✅ FIX: Destructure data and error separately
    // ✅ DEV DEBUG: Log email content if we are in development
    if (process.env.NODE_ENV !== 'production') {
      console.log(`📧 [DEV LOG] Sending Email to: ${to}`);
      console.log(`Subject: ${subject}`);
      console.log(`HTML Preview: ${html.substring(0, 100)}...`);
    }

    const { data, error } = await resend.emails.send({
      from: 'EAST Training <onboarding@resend.dev>',
      to,
      subject,
      html,
    });

    // ✅ FIX: Check for API-level errors (like invalid email, domain issues)
    if (error) {
      console.error('❌ Resend API Error:', error);
      return null;
    }

    console.log(`📧 Email sent to ${to}:`, data);
    return data;

  } catch (error) {
    // This catches network errors or code crashes
    console.error('❌ Unexpected Error sending email:', error);
    return null;
  }
}