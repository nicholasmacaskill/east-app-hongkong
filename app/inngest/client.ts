// app/inngest/client.ts

import { Inngest } from "inngest";
import { Resend } from 'resend';

// Initialize the Inngest client with an ID for your application
export const inngest = new Inngest({ id: "east-training-app" });

// ------------------------------------------------------------------
// Example Inngest Function: Send a Booking Confirmation Email
// ------------------------------------------------------------------

export const sendConfirmationEmail = inngest.createFunction(
  { id: "send-booking-confirmation-email" },
  { event: "app/booking.registered" },
  async ({ event, step }) => {
    // Note: The event payload is passed to the function
    const { contact_email, first_name, remainingCredits } = event.data;

    // Use step.run() to make this operation retriable and observable
    await step.run("send-confirmation-email", async () => {
      // NOTE: You must import Resend here, or from a separate utility file 
      // where it's not run directly in the route handler.
      const resend = new Resend(process.env.RESEND_API_KEY); 

      await resend.emails.send({
        from: 'EAST Training <onboarding@resend.dev>', // Update this
        to: contact_email,
        subject: 'Booking Confirmed - EAST Training',
        html: `<p>Hi ${first_name},</p><p>Your spot is confirmed! You have ${remainingCredits} credits remaining.</p>`
      });
    });

    return { success: true, message: `Email sent to ${contact_email}` };
  }
);


// Export all your functions in an array
export const functions = [
  sendConfirmationEmail
  // Add more functions here later
];