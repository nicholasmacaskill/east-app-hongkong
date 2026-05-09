# EAST Sports Group - Operational Core

**System Status**: 🟢 **LIVE** (Production)
**Domain**: [`app.eastsportsgroup.com`](https://app.eastsportsgroup.com)

---

## 🚀 The Vision: A High-Performance Digital Ecosystem

**The EAST App** is not just a scheduling tool—it is the digital nervous system of EAST Sports Group. Designed to professionalize youth sports management in Hong Kong, it replaces fragmented legacy systems with a unified, self-service platform that empowers three key groups:

1.  **Athletes**: Gain a professional-grade profile with tracked statistics (Goals, Assists, XP), milestones, and a clear path to high-performance development.
2.  **Parents**: Experience a frictionless, "Amazon-like" booking experience. Managing multiple children, purchasing recurring memberships, and booking complex sessions is handled in seconds, not email chains.
3.  **Coaches & Admins**: Reclaim hundreds of hours of administrative time through automated rosters, capacity enforcement, and zero-touch payment reconciliation.

This system moves EAST from a service provider to a **Tech-Enabled Sports Organization**, setting a new standard for operational excellence in the region.

---

## ✨ Core Product Pillars

The application is architected around five interconnected pillars, ensuring data consistency and user engagement.

### 1. The Credit Economy (Financial Engine)
We replaced cash and bank transfers with a seamless digital economy.
*   **Stripe Integration**: Deep integration with Stripe for both recurring subscriptions (Memberships) and ad-hoc purchases (Top-Ups).
*   **Credit Abstraction**: Users transact in "Credits" rather than cash. This decouples booking from billing, allowing for bulk discounts, easy refunds, and instant booking speed.
*   **Zero-Touch Reconciliation**: Every transaction is verified via Webhooks, debiting/crediting wallets automatically without manual oversight.

### 2. Smart Family Management (Identity)
We solved the complex "Parent-Child" data problem.
*   **Multi-Profile Accounts**: A single Parent login controls unlimited Child profiles.
*   **Context-Aware Booking**: When a parent selects a session, the system intelligently asks *"Who is this for?"*, ensuring attendance records and statistics are attributed to the child, while the payment comes from the parent.
*   **Granular Statistics**: Each child maintains their own distinct statistical history and progression, fostering a sense of ownership and achievement.

### 3. Intelligent Scheduling (Operations)
We eliminated overbooking and admin chaos.
*   **Real-Time Capacity**: Database-enforced session limits prevent overbooking instantly.
*   **Role-Based Views**:
    *   *Players/Parents* see a curated feed of available training.
    *   *Coaches* access their specific rosters.
    *   *Admins* maintain a god-view of the entire organization.
*   **Automated Communication**: Every booking, cancellation, and waitlist movement triggers a branded transactional email via **Resend**, keeping everyone aligned.

### 4. Community & Engagement (Retention)
We turned a booking tool into a social hub.
*   **Live Feed**: A social-media style feed for internal announcements, photos, and team updates.
*   **Direct Messaging**: Secure, internal communication channels between families and staff, centralizing support and reducing WhatsApp clutter.
*   **Leaderboards**: Automated statistical leaderboards for Golf and Hockey training gamify the development process.

### 5. Facility Access Control (Security)
We digitized physical security.
*   **Dynamic QR Codes**: The user's "Wallet" generates a secure, rotatable QR code.
*   **Admin Scanner**: Facility staff use the built-in scanner to verify active membership status and check-in athletes in milliseconds.

---

## 🛠️ Technology Stack

Built on a modern, type-safe stack designed for reliability and speed.

| Layer | Technology | Key Function |
| :--- | :--- | :--- |
| **Framework** | **Next.js 16** (App Router) | High-performance Server Side Rendering & API Routes. |
| **Language** | **TypeScript** | Strict type safety across the entire codebase. |
| **Database** | **Supabase** (PostgreSQL) | Relational data, complex queries, and Row Guard Security. |
| **Payments** | **Stripe** | PCI-compliant payment processing & subscription logic. |
| **Emails** | **Resend** | High-deliverability transactional email infrastructure. |
| **Styling** | **Tailwind CSS 4** | rapid, consistent, and responsive UI design. |

---

## 🏛️ Documentation Index

For developers and system administrators, please refer to the specific guides below:

*   **[`project-docs/OPERATIONS.md`](project-docs/OPERATIONS.md)**: **(NEW)** The Runbook. How to manage the live system, process refunds, edit schedules, and troubleshoot common issues.
*   **[`project-docs/API_OVERVIEW.md`](project-docs/API_OVERVIEW.md)**: **(NEW)** Technical reference for the Payment and Webhook API endpoints.
*   **[`project-docs/SETUP_GUIDE.md`](project-docs/SETUP_GUIDE.md)**: Instructions for setting up a local development environment.
*   **[`project-docs/DB_MIGRATION_GUIDE.md`](project-docs/DB_MIGRATION_GUIDE.md)**: How to modify the database schema safely.
*   **[`project-docs/PLAYWRIGHT_TESTING_STANDARDS.md`](project-docs/PLAYWRIGHT_TESTING_STANDARDS.md)**: Standards for our E2E testing suite.

---

## 🟢 Live System Status

| Service | Environment | Status | Configuration |
| :--- | :--- | :--- | :--- |
| **Frontend** | Vercel | 🟢 **Production** | `app.eastsportsgroup.com` |
| **Database** | Supabase | 🟢 **Production** | Hosted (Singapore Region) |
| **Payments** | Stripe | 🟢 **Live Mode** | Processing real cards (HKD) |
| **Webhooks** | Stripe | 🟢 **Active** | `checkout` & `invoice` events enabled |
| **Emails** | Resend | 🟢 **Active** | Sending via `eastsportsgroup.com` |
| **Deployment** | Vercel Integration | 🟢 **Automated** | Auto-deploy on Push to Main/Test |

---

*This operational core is property of EAST Sports Group.*
# Trigger deployment
