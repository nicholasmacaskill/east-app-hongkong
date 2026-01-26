# EAST Sports Group - Training Management Platform

A production-grade, mobile-first web application for managing sports training programs, athlete development, and community engagement in Hong Kong. Built for EAST Sports Group to streamline operations, enhance athlete experience, and create a unified digital ecosystem for coaches, parents, and players.

## 📋 Table of Contents

1. [About the Project](#about-the-project)
2. [✨ Core Features](#-core-features)
3. [🚀 Getting Started (Zero-to-Hero Setup)](#-getting-started-zero-to-hero-setup)
4. [🛠️ Tech Stack](#-tech-stack)
5. [🏛️ Primary Screens](#️-primary-screens)
6. [🗄️ Database & Automation](#️-database--automation)

---

## About the Project

EAST Sports Group operates multiple ice hockey training programs across Hong Kong, serving youth and adult athletes with professional coaching, facility access, and competitive development pathways. This platform replaces fragmented manual processes with a cohesive digital experience.

### The Challenge
Traditional sports program management suffers from:
- **Fragmented Communication**: WhatsApp groups, email chains, and phone calls create information silos
- **Manual Booking Systems**: Spreadsheets and paper sign-ups lead to overbooking and confusion
- **Payment Friction**: Cash handling, manual receipt tracking, and delayed reconciliation
- **No Athlete Insights**: Parents and players lack visibility into progress and statistics
- **Administrative Overhead**: Coaches spend hours on admin instead of coaching

### The Solution
A single, reliable platform that:
- **Automates Operations**: Credit-based booking system with automated payment processing via Stripe
- **Empowers Athletes**: Real-time statistics tracking, personalized profiles, and performance insights
- **Builds Community**: Integrated social feed and messaging for team cohesion
- **Reduces Admin**: Self-service scheduling, automated notifications, and digital check-in via QR codes
- **Scales Safely**: Built with production-grade standards, zero-trust security, and comprehensive testing

### Development Philosophy
This project follows a **high-quality, maintainable-first approach**:

- **Zero-Trust Security**: Role-based access control (RBAC) enforced at database level with Row-Level Security (RLS)
- **Definition of Done Compliance**: Every feature must pass 6 criteria before merge (schema sync, API logic, type safety, UI flow, regression audit, empty states)
- **Risk-Driven Development**: Active `LAUNCH_RISKS.md` tracking and mitigation of production risks before they materialize
- **AI-Assisted Engineering**: Leverages agent-based development with clear protocols, but human oversight on critical paths
- **Test-First Mindset**: Playwright E2E tests for critical flows, database constraint testing, and automated regression checks
- **Progressive Enhancement**: Mobile-first design that degrades gracefully and works offline where possible

---

## ✨ Core Features

The app is structured around five main pillars, enhanced by robust payment and notification systems.

### 💳 Payments & Credits (NEW)
* **Integrated Stripe Checkout:** Seamlessly purchase Memberships and Credit Top-Ups directly within the app.
* **Smart Credit System:** Credits are the internal currency for booking. Top-ups are automagically added to the user's balance via secure Webhooks.
* **Transactional Emails:** Instant confirmation emails for purchases, bookings, and cancellations powered by **Resend**.

### 📊 Dashboard (Home & Schedule)
* **Dynamic Booking Feed:** Displays upcoming Adult/Youth Classes, Private Coaches, and Facility Bookings.
* **Modal Session Details:** Provides full descriptions, images, instructor bios, and one-click booking.
* **Calendar View:** Dedicated screen to visualize all registered events in a weekly calendar format.

### 👤 Profile & Statistics
* **Player Stats:** Visual display of key hockey statistics (Goals, Assists, PIM, Games Played, Milestones).
* **Self-Service Settings:** Users can update their profile, view credit balance, and access top-up options.

### 📱 Community & Messaging
* **Real-time Social Feed:** Users can create posts, upload images (Supabase Storage), and interact via likes.
* **Messenger:** Direct messaging system with image support and real-time updates.

### 🔑 Check-In & Access
* **QR Code Access:** Dedicated QR screen for members to display their unique code for facility check-in.
* **QR Scanner:** Admin tool for staff to scan and verify member access.

---

## 🚀 Getting Started (Zero-to-Hero Setup)

We have created an automated, "Agentic" implementation plan to help new developers (and AI agents) set up the environment from scratch.

### 🤖 Automated Setup (Recommended)
This method allows your AI Agent to set up the entire environment for you.

1.  **Open the Setup Guide:** Open **[`SETUP_GUIDE.md`](./SETUP_GUIDE.md)** in your editor.
2.  **Copy the Instructions:** Copy the entire contents of the file.
3.  **Open AI Chat:** Open your Agent Interface (Sidebar or `Cmd+L`).
4.  **Prompt the Agent:** Paste the text and type:
    > *"Follow these instructions to set up my local environment."*

The Agent will handle installing tools, getting keys, and configuring the database.

### Quick Commands (For Manual Setup)
```bash
# Install dependencies
pnpm install

# Start Dev Server
pnpm dev

# Reset Database (if needed)
npx tsx run_sql.ts
```

---

## 🧪 Debugging & Automated Testing

We use **Playwright** for End-to-End (E2E) testing to ensure stability across critical flows, including Payments and Admin actions.

### Running Tests
```bash
# Run all tests (Headless)
npx playwright test

# Run specific payment tests (bypassing Stripe signature verification)
npx playwright test tests/stripe-payments.spec.ts --project=no-auth

# View visual report of last run
npx playwright show-report
```

### 🆘 Admin Recovery
If you lose access to the Admin portal or need to set up a fresh admin in production (since we removed the default `admin@east.com`):
```bash
node database/create_admin.cjs <your-email> <new-password>
```

---


## 🛠️ Tech Stack

| Layer | Technology | Service/Library | Purpose |
| :--- | :--- | :--- | :--- |
| **Framework** | Next.js 16 | App Router | Core Application & API |
| **Language** | TypeScript | - | Type Safety |
| **Styling** | Tailwind CSS 4 | - | Utility-first Design |
| **Backend** | Supabase | PostgreSQL | Auth, DB, Realtime, Storage |
| **Payments** | Stripe | Checkout & Webhooks | Payment Processing |
| **Email** | Resend | API | Transactional Notifications |
| **Icons** | Lucide React | - | UI Iconography |

---

## 🏛️ Primary Screens

| Screen | Focus | Primary Files |
| :--- | :--- | :--- |
| **Home** | Discover & Register for events/news. | `app/components/screens/HomeScreen.tsx` |
| **Profile** | User details, Credits, & Top-Up. | `app/components/screens/PlayerProfile.tsx` |
| **Check-In** | QR Code management & Scanning. | `app/components/screens/QRScreen.tsx` |
| **Schedule** | Calendar view of registered sessions. | `app/components/screens/ScheduleScreen.tsx` |
| **Community** | Social feed & direct messaging. | `app/components/CommunityScreen.tsx` |

---

## 🗄️ Database & Automation

We utilize **Supabase (PostgreSQL)** not just for storage, but for automation.

### 🤖 Intelligent Triggers
* **`handle_new_user`**: Automatically triggers when a user registers via Supabase Auth. It creates a corresponding row in the `public.profiles` table and populates their `contact_email`, ensuring they are instantly ready for Stripe billing without manual admin intervention.

### Key Tables
* **`profiles`**: Stores user identity, credit balance, and Stripe Customer IDs.
* **`sessions`**: Catalog of all classes, events, and facilities.
* **`registrations`**: Link table handling user bookings (with Cascade Delete support).
* **`players_stats`**: High-performance data storage for athlete metrics.

---

# East App Hongkong - Comprehensive QA Manual

This guide provides a structured approach to manually testing the East App Hongkong application. It covers environment setup, user role verification, and critical workflows.

## 1. Environment Verification
**Objective**: Ensure the local environment is correctly configured for testing.

| Component | Check | Expected Result |
| :--- | :--- | :--- |
| **Server** | Terminal: `npm run dev` | Running on `http://localhost:3000` without errors. |
| **Database** | Terminal: `npx supabase status` | All services (Auth, DB, APIs) are **active**. |
| **Stripe** | `.env.local` | Stripe Publishable/Secret keys are present. |
| **Admin Seeding** | DB (`auth.users`) | Admin user (`admin@east.com`) exists. |

---

## 2. User Roles & Profiles
**Objective**: Verify that each user role has access to the correct profile features and data.

### A. Player Scenario
**Credentials**: Log in as a standard player (e.g., `player@example.com`).

| Feature | Action | QA Check |
| :--- | :--- | :--- |
| **Profile View** | Navigate to Profile tab. | • Avatar, Name, and Team are visible.<br>• "XP" progress bar is rendered.<br>• **Stats Section**: Check for Season/Career stats (GP, Goals, Assists). |
| **Public Link** | Open `http://localhost:3000/player/[PLAYER_ID]` in incognito. | • Public profile loads.<br>• Restricted actions (Edit) are hidden. |
| **Wallet** | Navigate to Wallet/QR tab. | • Current credit balance is displayed.<br>• QR code is generated. |

### B. Parent Scenario
**Credentials**: Log in as a parent (e.g., `parent@example.com`).

| Feature | Action | QA Check |
| :--- | :--- | :--- |
| **Family Dashboard** | Navigate to Profile tab. | • "PARENT" badge is visible.<br>• **Athletes Tab**: Lists all registered children. |
| **Add Child** | Click `+ Register New Athlete`. | • Modal opens.<br>• Enter Name > Save.<br>• New child appears in the list immediately. |
| **Child Management** | Click on a child card. | • Child is selected (visually highlighted).<br>• Stats/Info updates to reflect selected child. |

### C. Coach Scenario
**Credentials**: Log in as a coach (e.g., `coach@example.com`).

| Feature | Action | QA Check |
| :--- | :--- | :--- |
| **Coach Profile** | Navigate to Profile tab. | • **Schedule Tab**: Shows upcoming coaching sessions.<br>• **My Teams**: Lists assigned teams. |
| **Availability** | Navigate to Availability settings. | • Ability to toggle available time slots. |

### D. Admin Scenario
**Credentials**: Log in as Admin.

| Feature | Action | QA Check |
| :--- | :--- | :--- |
| **Dashboard** | Navigate to `/sys-admin`. | • Access granted (no redirect to home).<br>• Admin sidebar is visible. |
| **Session Mgmt** | Go to `/sys-admin/schedule`. | • Create a new session.<br>• Verify it appears on the main app schedule. |

---

## 3. Critical Workflows

### A. Wallet & Membership
**Goal**: Verify top-up and plan purchasing.

1.  **Top-Up Credits**:
    *   **Action**: Go to Wallet > Tap "Top Up" (or Credits display).
    *   **QA Check**: Redirects to Stripe Checkout. Completing (test mode) adds credits to balance.
2.  **Purchase Membership**:
    *   **Action**: Go to Wallet > Click "View Membership Options".
    *   **UI Check**: "Elite Pass" is the only visible option.
    *   **Action**: Click to Purchase.
    *   **QA Check**: Redirects to Stripe. After success, user is returned to app with updated status/credits.

### B. Booking System (Standard)
**Goal**: Verify a user can book a class for themselves.

1.  **Browse Schedule**:
    *   **Action**: Go to Schedule tab.
    *   **QA Check**: Classes are listed correctly by date.
2.  **Book Session**:
    *   **Action**: Tap a class > Tap "Pay X Credits".
    *   **QA Check**: Success message appears. Credits deducted from wallet.
    *   **Verification**: "My Booking" status appears on the class.

### C. Booking System (Parent-Child)
**Goal**: Verify a parent can book for a specific child.

> [!IMPORTANT]
> **Prerequisite**: Logged in as Parent with at least one child registered.

1.  **Select Child**:
    *   **Action**: Tap a class in Schedule to open modal.
    *   **UI Check**: "WHO IS THIS FOR?" selector is visible.
2.  **Book**:
    *   **Action**: Select "Child Name" > Confirm Booking.
    *   **QA Check**: Booking is confirmed.
    *   **API Verification**: In Database (`registrations` table), `user_id` should match the **Child's ID**, not the Parent's ID.

### D. Community & Posts
**Goal**: Verify social features (if applicable).

1.  **View Feed**:
    *   **Action**: Go to Community tab.
    *   **QA Check**: Posts feed loads correctly.
2.  **Create Post**:
    *   **Action**: Tap "New Post" (if available).
    *   **QA Check**: Post appears in feed.

---

## 4. Troubleshooting Guide

| Issue | Potential Cause | Fix |
| :--- | :--- | :--- |
| **"Insufficient Credits" Error** | User balance is lower than session cost. | Use Admin or DB to manually increase `credits` in `profiles` table. |
| **Admin Access Denied** | Middleware blocking or wrong role. | Check `role` column in `profiles` table is 'admin'. Temporarily disable middleware. |
| **Stripe Error** | Invalid keys or secrets. | Verify `.env.local` matches Stripe Dashboard (Test Mode). |
| **White Screen / Crash** | React runtime error. | Check terminal running `npm run dev` for stack trace. |

---

## 5. Deployment QA Checklist (Pre-Live)

Use this checklist to ensure a smooth transition from development to a live production environment.

### 🔐 1. Environment & Auth
- [ ] **NEXT_PUBLIC_BASE_URL**: Updated from `localhost:3000` to the actual production domain (e.g., `https://east-app-hongkong.vercel.app`).
- [ ] **Supabase URL/Anon Key**: Switched from local containers to a hosted Supabase project.
- [ ] **SUPABASE_SERVICE_ROLE_KEY**: Present in production environment but **NEVER** exposed in public-facing code or client-side logs.
- [ ] **Redirect URLs**: Added production domain to Supabase Auth > URL Configuration > Redirect URLs.

### 💳 2. Payment Integration (Stripe)
- [ ] **Live Mode Toggle**: Switched from `pk_test_...` and `sk_test_...` to production `pk_live_...` and `sk_live_...`.
- [ ] **Webhook Endpoint**: Created a new Webhook in Stripe Dashboard pointing to `https://your-domain.com/api/webhooks/stripe`.
- [ ] **STRIPE_WEBHOOK_SECRET**: Updated to match the "Signing Secret" of the new live webhook endpoint.
- [ ] **Price IDs**: Verified that `price_...` IDs in `.env` match the products created in the **Stripe Live Environment**.

### 📧 3. Email Delivery (Resend)
- [ ] **Domain Authentication**: Added and verified your sending domain in the Resend Dashboard.
- [ ] **API Key**: Switched to a production Resend API Key.
- [ ] **Onboarding Check**: Verified that emails can be sent to non-owner addresses.

### 🗄️ 4. Data & Logic
- [ ] **Database Migrations**: Ran `npx tsx run_sql.ts` against the production DB to ensure all tables, triggers, and the `preferences` column are present.
- [ ] **Admin Account**: Run `node database/create_admin.cjs <email> <password>` to create/promote the main admin.
- [ ] **CORS/CSP**: Enabled restricted CORS settings in Supabase and Next.js to only allow requests from the production domain.

### 🖼️ 5. Assets & UX
- [ ] **Image Hosting**: Verified that gallery images/avatars are stored correctly in a public Supabase Storage bucket.
- [ ] **Build Check**: Ran `npm run build` locally to ensure zero TypeScript or Linting errors exist.

