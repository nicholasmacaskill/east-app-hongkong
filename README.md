# EAST Sports Group — Operational Core

**System Status**: 🟢 **LIVE** (Production)  
**Domain**: [`app.eastsportsgroup.com`](https://app.eastsportsgroup.com)

---

## 🚀 The Vision: A High-Performance Digital Ecosystem

**The EAST App** is the digital nervous system of EAST Sports Group. Designed to professionalize youth sports management in Hong Kong, it replaces fragmented legacy systems with a unified, self-service platform that empowers three key groups:

1. **Athletes** — A professional-grade profile with tracked statistics (Goals, Assists, XP), milestones, a Drill Hub for skill development, and a clear path to high-performance growth.
2. **Parents** — A frictionless, "Amazon-like" booking experience. Managing multiple children, purchasing recurring memberships, and booking complex sessions is handled in seconds, not email chains.
3. **Coaches & Admins** — Reclaim hundreds of hours of administrative time through automated rosters, capacity enforcement, direct messaging, and zero-touch payment reconciliation.

This system moves EAST from a service provider to a **Tech-Enabled Sports Organization**, setting a new standard for operational excellence in the region.

---

## ✨ Core Product Pillars

The application is architected around five interconnected pillars, ensuring data consistency and user engagement across every role.

### 1. 💳 The Credit Economy (Financial Engine)
We replaced cash and bank transfers with a seamless digital economy.
- **Stripe Integration** — Deep integration with Stripe for recurring subscriptions (Memberships) and ad-hoc purchases (Top-Ups).
- **Credit Abstraction** — Users transact in "Credits" rather than cash. This decouples booking from billing, enabling bulk discounts, easy refunds, and instant booking.
- **Zero-Touch Reconciliation** — Every transaction is verified via Stripe Webhooks, automatically debiting/crediting wallets without manual oversight.
- **Membership Tiers** — Gym, All-Access, and Elite tiers with automated Stripe subscription lifecycle management.

### 2. 👨‍👩‍👧 Smart Family Management (Identity)
We solved the complex "Parent–Child" data problem.
- **Multi-Profile Accounts** — A single Parent login controls unlimited child profiles.
- **Context-Aware Booking** — When a parent selects a session, the system asks *"Who is this for?"*, ensuring attendance records and statistics are attributed to the correct child.
- **Granular Statistics** — Each child maintains their own statistical history and progression, fostering a sense of ownership and achievement.
- **Rebooking Flow** — Cancelled sessions can be rebooked seamlessly via a dedicated state-transition RPC.

### 3. 📅 Intelligent Scheduling (Operations)
We eliminated overbooking and administrative chaos.
- **Real-Time Capacity** — Database-enforced session limits prevent overbooking at the row level.
- **Role-Based Views**:
  - *Players/Parents* see a curated feed of available training.
  - *Coaches* access their specific rosters and athlete management.
  - *Admins* maintain a god-view of the entire organization.
- **Automated Communication** — Every booking, cancellation, and waitlist movement triggers a branded transactional email via **Resend**, keeping everyone aligned automatically.

### 4. 🏒 Drill Hub & Athlete Development (Engagement)
We built a structured environment for athletes to develop their skills.
- **Drill Library** — Coaches can create, edit, and manage a library of drills with video content and descriptions.
- **Training Plans** — Structured multi-drill sequences assigned to athletes or teams.
- **Athlete Inbox** — Direct, real-time messaging between coaches and athletes for feedback and instruction, with inbox alerts surfaced on the home screen.
- **Leaderboards** — Automated statistical leaderboards for Golf and Hockey training that gamify athlete development.

### 5. 🔐 Facility Access Control (Security)
We digitized physical security for the facility.
- **Dynamic QR Codes** — The user's "Wallet" generates a secure, rotatable QR code tied to their membership.
- **Admin Scanner** — Facility staff use the built-in QR scanner to verify active membership status and check-in athletes in milliseconds.
- **Community Feed** — A social-media-style feed for internal announcements, team photos, and club updates, reducing reliance on external platforms.

---

## 🛠️ Technology Stack

Built on a modern, fully type-safe stack designed for reliability, security, and speed.

| Layer | Technology | Key Function |
| :--- | :--- | :--- |
| **Framework** | **Next.js 15** (App Router) | Server-side rendering, API Routes, and edge performance. |
| **Language** | **TypeScript** | Strict type safety across the entire codebase. |
| **Database** | **Supabase** (PostgreSQL) | Relational data, RLS policies, and real-time subscriptions. |
| **Auth** | **Supabase Auth** | JWT-based authentication with role-aware middleware. |
| **Payments** | **Stripe** | PCI-compliant processing, subscriptions, and webhook events. |
| **Emails** | **Resend** | High-deliverability transactional email infrastructure. |
| **Background Jobs** | **Inngest** | Durable, event-driven background tasks and scheduled jobs. |
| **Rate Limiting** | **Upstash Redis** | Serverless rate-limiting on sensitive API endpoints. |
| **Observability** | **Sentry** | Error tracking and performance monitoring in production. |
| **Analytics** | **PostHog + Vercel** | Product analytics and web vitals monitoring. |
| **Styling** | **Tailwind CSS** | Rapid, consistent, and responsive UI design. |
| **Testing** | **Playwright** | End-to-end and security audit testing suite. |
| **Deployment** | **Vercel** | Automated CI/CD with branch preview environments. |

---

## 🏛️ Role System

The app enforces strict role boundaries at every layer (middleware, RLS, and API routes):

| Role | Access Level | Key Capabilities |
| :--- | :--- | :--- |
| `sys-admin` | Full Access | All operations, user management, system configuration. |
| `coach` | Team/Schedule | Roster management, drill creation, session scheduling, messaging. |
| `parent` | Payments/Bookings | Booking sessions, managing child profiles, wallet top-ups. |
| `player` | Read-Only | Viewing stats, drill content, and inbox messages. |

> **Security Note**: The `supabaseAdmin` client (service role key) is **server-only** and is never exposed to client-side code. All client operations go through `app/lib/supabase.ts` with Row Level Security enforced at the database level.

---

## 🔧 Local Development Setup

### Prerequisites
- **Node.js** 18+ (or 20 LTS recommended)
- **pnpm** (used as the package manager)
- **Stripe CLI** — `brew install stripe/stripe-cli/stripe`
- Access to the Supabase project and Stripe account credentials.

### 1. Clone & Install

```bash
git clone https://github.com/nicholasmacaskill/east-app-hongkong.git
cd east-app-hongkong
pnpm install
```

### 2. Environment Variables

Pull production environment variables via the Vercel CLI (always use this as the source of truth):

```bash
npx vercel env pull .env.production.local
```

Or create a `.env.local` from the example:

```bash
cp .env.example .env.local
# Fill in the values (contact Nic for credentials)
```

Key variables required:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Stripe
STRIPE_SECRET_KEY=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
STRIPE_WEBHOOK_SECRET=
NEXT_PUBLIC_STRIPE_PRICE_GYM=
NEXT_PUBLIC_STRIPE_PRICE_ALL=
NEXT_PUBLIC_STRIPE_PRICE_ELITE=
NEXT_PUBLIC_STRIPE_PRICE_TOPUP=

# Email
RESEND_API_KEY=
```

### 3. Stripe Webhooks (Local)

In a separate terminal, start the Stripe webhook listener and forward events to your local server:

```bash
stripe login
stripe listen --forward-to localhost:3000/api/webhooks/stripe
# Copy the whsec_... key into your .env.local as STRIPE_WEBHOOK_SECRET
```

### 4. Run the Development Server

```bash
# Standard dev (uses test Stripe mode by default)
pnpm dev

# Explicitly run with test Stripe keys
pnpm dev:test

# Explicitly run with live Stripe keys (use with caution)
pnpm dev:live
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### 5. Test Accounts

| Role | Email | Password |
| :--- | :--- | :--- |
| Admin | `admin@east.com` | `password123` |
| Coach | `coach@east.com` | `password123` |
| Parent | `parent@east.com` | `password123` |
| Player | `player@east.com` | `password123` |

---

## 🗄️ Database & Migrations

> **CRITICAL**: Never run raw SQL directly. All schema changes must be written as TypeScript migration scripts.

Database migrations live in `/database` and are executed using `ts-node`:

```bash
# Example: run a migration script
npx ts-node database/your_migration_script.ts

# Enable RLS security policies
pnpm db:secure
```

See [`project-docs/DB_MIGRATION_GUIDE.md`](project-docs/DB_MIGRATION_GUIDE.md) for the full migration workflow.

---

## 🧪 Testing

The project uses Playwright for end-to-end and security testing. All multi-layer changes (DB + API, Auth + Data) require a dedicated E2E test.

```bash
# Run the full test suite
pnpm test:full

# Run the security audit
pnpm test:security

# Run visual regression tests
pnpm test:visual

# Update visual regression snapshots
pnpm test:update-snapshots
```

See [`project-docs/PLAYWRIGHT_TESTING_STANDARDS.md`](project-docs/PLAYWRIGHT_TESTING_STANDARDS.md) for testing standards and [`project-docs/DEFINITION_OF_DONE.md`](project-docs/DEFINITION_OF_DONE.md) for completion criteria.

---

## 📁 Project Structure

```
east-app-hongkong/
├── app/                        # Next.js App Router
│   ├── api/                    # API Routes (payments, webhooks, admin)
│   ├── components/             # Shared UI components
│   ├── lib/                    # Supabase clients, utilities
│   │   ├── supabase.ts         # Client-side (RLS-enforced)
│   │   └── supabaseAdmin.ts    # Server-only (service role)
│   ├── types/                  # TypeScript types & role definitions
│   ├── drill-hub/              # Drill Hub feature
│   ├── community/              # Feed & messaging
│   ├── membership/             # Subscription management
│   ├── calendar/               # Session scheduling
│   ├── top-up/                 # Credit wallet top-ups
│   ├── qr/                     # QR wallet & scanner
│   └── sys-admin/              # System admin panel
├── database/                   # TypeScript migration scripts
├── project-docs/               # Architecture & operational guides
├── scripts/                    # Debug, seed, and audit scripts
├── tests/                      # Playwright test specs
└── playwright/                 # Playwright helpers & fixtures
```

---

## 📚 Documentation Index

| Document | Description |
| :--- | :--- |
| [`project-docs/AGENTS.md`](project-docs/AGENTS.md) | **Source of Truth.** AI agent orchestration, roles, and safety protocols. |
| [`project-docs/SETUP_GUIDE.md`](project-docs/SETUP_GUIDE.md) | Local development environment setup guide. |
| [`project-docs/DB_MIGRATION_GUIDE.md`](project-docs/DB_MIGRATION_GUIDE.md) | How to modify the database schema safely. |
| [`project-docs/API_OVERVIEW.md`](project-docs/API_OVERVIEW.md) | Technical reference for Payment and Webhook API endpoints. |
| [`project-docs/PLAYWRIGHT_TESTING_STANDARDS.md`](project-docs/PLAYWRIGHT_TESTING_STANDARDS.md) | E2E testing standards and conventions. |
| [`project-docs/DEFINITION_OF_DONE.md`](project-docs/DEFINITION_OF_DONE.md) | Mandatory checklist before any feature is considered complete. |
| [`project-docs/SECURITY_AND_SCALING_ROADMAP.md`](project-docs/SECURITY_AND_SCALING_ROADMAP.md) | Security posture and future scaling considerations. |
| [`project-docs/CI_CD_PROCESS.md`](project-docs/CI_CD_PROCESS.md) | Deployment pipeline and CI/CD workflow. |
| [`DEPLOYMENT.md`](DEPLOYMENT.md) | Production deployment runbook. |

---

## 🟢 Live System Status

| Service | Environment | Status | Configuration |
| :--- | :--- | :--- | :--- |
| **Frontend** | Vercel | 🟢 **Production** | `app.eastsportsgroup.com` |
| **Database** | Supabase | 🟢 **Production** | Hosted (Singapore Region) |
| **Payments** | Stripe | 🟢 **Live Mode** | Processing real cards (HKD) |
| **Webhooks** | Stripe | 🟢 **Active** | `checkout` & `invoice` events |
| **Emails** | Resend | 🟢 **Active** | Sending via `eastsportsgroup.com` |
| **Background Jobs** | Inngest | 🟢 **Active** | Durable event-driven functions |
| **Rate Limiting** | Upstash Redis | 🟢 **Active** | Serverless edge rate limiting |
| **Observability** | Sentry | 🟢 **Active** | Error tracking & performance |
| **Deployment** | Vercel | 🟢 **Automated** | Auto-deploy on push to `main` |

---

## 🤝 Contributing & Agent Protocol

This project uses a three-agent orchestration model defined in [`project-docs/AGENTS.md`](project-docs/AGENTS.md):

- **@Architect** — Backend logic, API routes, database migrations, planning.
- **@Auditor** — Security review, RLS policy validation, role-based access control.
- **@Council** — Full chain: Architect → Auditor → Executor.

All agents must adhere to the [`project-docs/DEFINITION_OF_DONE.md`](project-docs/DEFINITION_OF_DONE.md) checklist before any change is considered complete.

---

*This operational core is property of EAST Sports Group. © 2025–2026 EAST Sports Group HK.*
