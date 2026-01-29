# API Technical Reference

This document outlines the core API endpoints that power the East App's payment and automation infrastructure.

---

## 💳 Payments API

### `POST /api/checkout`
Initiates a Stripe Checkout session for either a Top-Up or a Membership subscription.

#### Authentication
*   **Protected**: Yes (Requires valid Supabase Session Cookie).
*   **Role Check**: None (Any authenticated user can pay).

#### Request Body
```json
{
  "priceId": "price_1SuxcY...", // Stripe Price ID (Live)
  "userId": "d82a8201...",    // UUID of the purchasing user
  "mode": "payment"           // "payment" (One-time) or "subscription" (Recurring)
}
```

#### Response
```json
{
  "sessionId": "cs_live_a1...", // Stripe Checkout Session ID
  "url": "https://checkout.stripe.com/..." // Redirect URL
}
```

#### Key Logic
1.  **Metadata Injection**: Injects the `userId` and `credits` amount (if top-up) into the Stripe Session `metadata`. This is crucial for the webhook to know who to credit later.
2.  **Customer Creation**: Automatically creates or retrieves a Stripe Customer ID for the user and saves it to the `profiles` table.

---

## 🪝 Webhooks API

### `POST /api/webhooks/stripe`
The nervous system of the app. Listens for events from Stripe and updates the database accordingly.

#### Security
*   **Signature Verification**: Strictly verifies the `Stripe-Signature` header using the `STRIPE_WEBHOOK_SECRET` env var.
*   **Raw Body**: Requires raw request body parsing (config: `api: { bodyParser: false }`) to generate the correct hash.

#### Supported Events

| Event | Action Taken |
| :--- | :--- |
| **`checkout.session.completed`** | **Top-Ups**: Reads `metadata.credits` and increments user's `credits` in DB.<br>**Memberships**: Sets `subscription_status` to 'active' and grants benefits. |
| **`invoice.payment_succeeded`** | **Renewals**: Logs the successful recurring payment. Extends access/benefits. |
| **`customer.subscription.updated`** | **Sync**: Updates `subscription_status` if user upgrades/downgrades in Stripe Portal. |
| **`customer.subscription.deleted`** | **Cancellation**: Sets `subscription_status` to 'canceled'. Removes benefits. |

#### Error Handling
*   Returns `200 OK` immediately upon successful verification to preventing Stripe retries.
*   Logs explicit errors to Vercel Logs if database updates fail.

---

## 🛡️ Admin API

### `POST /api/admin/scan-access`
Verifies a user's status for facility entry.

#### Authentication
*   **Protected**: Yes.
*   **Role Check**: Strict **'Admin'** role required via Database RLS.

#### Request Body
```json
{
  "qrCode": "..." // Encrypted JWT from user's wallet
}
```

#### Response
```json
{
  "valid": true,
  "user": {
    "name": "John Doe",
    "membership": "PRO",
    "credits": 500
  }
}
```
