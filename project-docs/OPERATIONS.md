# Operations Runbook (Live System)

This guide is for **Admins** and **Support Staff** managing the live East App Hongkong platform.

---

## 📅 Daily Operations

### 1. Managing Users (Creating Admins)
User roles are strictly enforced at the database level. To promote a user (e.g., a new Head Coach) to an Admin behavior:

1.  Ask the user to sign up via the app normally.
2.  Log in to the **Supabase Dashboard**.
3.  Go to **Table Editor** > `profiles`.
4.  Filter by their email.
5.  Change the `role` column from `player` to `admin`.
6.  Click **Save**. The user will now see the `/sys-admin` dashboard upon refresh.

### 2. Scanning QR Codes (Facility Access)
1.  Log in as an Admin on your phone.
2.  Navigate to **Menu > Admin > Scan Access**.
3.  Grant camera permissions.
4.  Scan the member's QR code.
    *   ✅ **Green Beep**: Valid membership, access granted.
    *   ❌ **Red Beep**: Membership expired or credits exhausted.

### 3. Managing the Schedule
1.  Go to `/sys-admin/schedule`.
2.  **Add Session**: Click "+ Create Session". Ensure you select the correct "Session Type" (this affects pricing and filtering).
3.  **Cancel Session**: Select the session > click "Cancel".
    *   ⚠️ **Warning**: This triggers an automated email to ALL registered participants notifying them of the cancellation. Credits are *not* automatically refunded yet (manual step required).

---

## 💳 Financial Operations (Stripe)

All billing is handled in the **Stripe Dashboard**. The app listens to Stripe; Stripe does not listen to the app.

### 1. Proccessing Refunds
If a user requests a refund for a top-up or membership:
1.  Log in to [dashboard.stripe.com](https://dashboard.stripe.com).
2.  Ensure you are in **Live Mode**.
3.  Search for the user's email.
4.  Find the specific **Payment**.
5.  Click **Refund**.
6.  **Crucial Step**: You must manually deduct the credits from the user's account in the app database if they have already spent them (Stripe does not talk back to the app for refunds).
    *   Go to Supabase > `profiles` > Manual edit `credits`.

### 2. Cancelling a Membership
Users can self-cancel, but if you need to force-cancel:
1.  Go to the **Customer** page in Stripe.
2.  Scroll to **Subscriptions**.
3.  Click **Cancel Subscription**.
    *   Select "Immediately" or "At period end".
4.  The app's Webhook will receive this event and automatically remove their "PRO" status and benefits.

---

## 🚨 Troubleshooting & Support

### "I paid but didn't get credits!"
**Cause**: The webhook might have failed or been delayed.
**Fix**:
1.  Check **Stripe Dashboard > Developers > Webhooks**.
2.  Look for "Failed" events.
3.  If the payment is successful in Stripe, you can manually fix the user:
    *   Go to Supabase > `profiles`.
    *   Find the user.
    *   Add the credits to their `credits` balance manually.

### "I can't book this session!"
**Common Reasons**:
1.  **Insufficient Credits**: Check their wallet balance.
2.  **Capacity Full**: The session is fully booked.
3.  **Role Lock**: Some sessions are "Invite Only" (requires Coach/Admin role).

### "I'm not receiving emails."
**Cause**: Spam filters or incorrect email address.
**Fix**:
1.  Check **Resend Dashboard > Logs**.
2.  Search for the user's email.
3.  If valid but "Delivered", ask them to check Span/Promotions.
4.  If "Bounced", their email provider blocked it.

---

## 🔐 Emergency Contacts

*   **Hosting Issues (Vercel)**: Check [status.vercel.com](https://status.vercel.com)
*   **Database Issues (Supabase)**: Check [status.supabase.com](https://status.supabase.com)
*   **Payment Issues (Stripe)**: Check [status.stripe.com](https://status.stripe.com)
