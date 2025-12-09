EAST Training App - High-Performance Community

EAST Training App is a comprehensive, mobile-first web application designed to manage and enhance the experience of members (Players and Parents) within a dedicated sports training and community group. Built on a modern, robust full-stack foundation, the application seamlessly integrates scheduling, personalized statistics, and real-time social networking.

Born from the need for a unified digital platform, EAST empowers members with self-service tools, rich statistical insights into their performance, and a central hub for community engagement.

📋 Table of Contents

About the Project

✨ Core Features

🏛️ The Five Pillars

🚀 Getting Started

🛠️ Tech Stack

🗺️ Development Scripts

🗄️ Database Structure

About the Project

The EAST Training App moves beyond simple scheduling to create a holistic, high-performance ecosystem.

The Problem: Traditional community sports organizations often struggle with fragmented communication, outdated booking systems, and difficulty providing personalized athlete feedback and timely announcements.

The Reality: Modern athletes (and their parents) expect instant access to their schedules, performance data, and community interactions—all in one slick, mobile-friendly interface.

EAST's Solution: A single source of truth for all member activities:

Registration: Multi-step login and registration flows supporting Player and Parent roles.

Performance: Dynamic Player Profile views showcasing detailed statistics and milestones.

Community: Real-time social feed and messenger functionality for instant communication.

✨ Core Features

The app is structured around five main tabs: Home, Profile, Check-In (QR), Schedule, and Community.

📊 Dashboard (Home & Schedule)

Dynamic Booking Feed: Displays upcoming Adult/Youth Classes, Private Coaches, and Facility Bookings.

Modal Session Details: Provides a full description, image, and available time slots for booking or cancelling sessions.

Registration API: Dedicated API routes (/api/register) to handle transactional booking/cancellation logic against the database.

Calendar View: Dedicated screen to visualize all registered events in a weekly calendar format.

👤 Profile & Statistics

Role-Based View: Separate optimized layouts for Players (focused on stats/streaks) and Parents (focused on athlete summaries/gallery/contributions) [cite: app/page.tsx].

Player Stats: Visual display of key hockey statistics (Goals, Assists, PIM, Games Played, Milestones like "Top Scorer") [cite: app/types/stats.ts, database/schema.sql].

User Management: Multi-step settings modal to edit profile, bio, update contact info, and manage notification preferences.

📱 Community & Messaging

Real-time Social Feed: Users can create posts, upload images (via Supabase Storage), like, share, and delete posts in real-time [cite: app/components/CommunityScreen.tsx].

Dynamic Messenger: Separate view for Direct Messages (DMs) with real-time message updates via Supabase Realtime.

🔑 Check-In & Access

QR Code Access: Dedicated QR screen for members to display their unique code for facility check-in [cite: app/qr/page.js].

QR Scanner: Dedicated camera screen (/check-in) for staff to scan member QR codes using the device camera (requires camera permissions via next.config.js) [cite: app/check-in/page.tsx].

🏛️ The Five Pillars (Primary Screens)

Pillar

Focus

Technologies

Primary Files

Home/Booking

Discover & Register for upcoming events and news.

Next.js API Routes (Serverless)

app/page.tsx, app/api/sessions/route.ts

Profile

View personal details, team context, and game statistics.

Tailwind CSS, Mock/DB State

app/page.tsx, app/types/stats.ts

Check-In

QR Code management for access control and check-in.

react-qr-scanner, HTML5 Permissions

app/qr/page.js, app/check-in/page.tsx

Schedule

Calendar view of all registered and upcoming sessions.

date-fns, Custom React Calendar Component

app/calendar/page.tsx, app/components/Calendar/index.tsx

Community

Social interaction, real-time posts, and direct messaging.

Supabase Realtime/Storage/DB

app/components/CommunityScreen.tsx

🚀 Getting Started

Prerequisites

Node.js (>=20.9.0) [cite: package.json]

pnpm (recommended package manager)

Supabase CLI (for local DB setup)

Installation

# 1. Clone the repository
git clone nicholasmacaskill/east-app-hongkong
cd east-app-hongkong

# 2. Install dependencies (using pnpm)
pnpm install


Environment Variables

Create a .env.local file in the root directory and populate it with your database credentials. These are accessed via app/lib/db.ts for direct PostgreSQL interaction and app/lib/supabase.ts for Supabase services.

⚠️ IMPORTANT: Replace the placeholders below with your actual credentials.

# Postgres connection details (Used by server-side API routes via app/lib/db.ts)
DB_HOST=[YOUR_DB_HOST] # e.g., localhost or your Supabase host
DB_PORT=[YOUR_DB_PORT] # e.g., 54322 for local, 5432 for remote
DB_USER=[YOUR_DB_USER]
DB_PASSWORD=[YOUR_DB_PASSWORD]
DB_NAME=[YOUR_DB_NAME] # e.g., postgres

# Supabase details (Used by client-side SDK via app/lib/supabase.ts)
# Get these values from your Supabase Project Settings -> API
NEXT_PUBLIC_SUPABASE_URL=[YOUR_SUPABASE_PROJECT_URL]
NEXT_PUBLIC_SUPABASE_ANON_KEY=[YOUR_ANON_PUBLIC_KEY]


Database Seeding

Run the seed script to ensure the players_stats table is created and populated with test data:

pnpm run seed


🛠️ Tech Stack

Layer

Technology

Version

Used For

Framework

Next.js

16.0.0

Routing, API Routes, SSR/CSR

Language

TypeScript

^5

Type Safety

Styling

Tailwind CSS

3.4.18

Utility-first CSS, Mobile-first Design

Database

PostgreSQL (pg)

^8.16.3

Core Data Storage

BaaS

Supabase SDK

^2.86.2

Auth, Realtime, Storage for Community Feed

Icons

Lucide React

^0.552.0

Interface Icons

🗺️ Development Scripts

Use these commands to manage the project locally:

pnpm run dev      # Starts Next.js server on http://localhost:3000
pnpm run build    # Creates optimized production build
pnpm run lint     # Runs ESLint checks
pnpm run seed     # Executes the database seeding script


🗄️ Database Structure

The players_stats table is the core relational structure for athlete performance tracking:

CREATE TABLE IF NOT EXISTS players_stats (
  player_id SERIAL PRIMARY KEY,
  age INTEGER,
  season INTEGER,
  team VARCHAR(255),
  games_played_season INTEGER,
  games_played_total INTEGER,
  games_missed_healthy INTEGER,
  games_missed_injured INTEGER,
  goals_season INTEGER,
  goals_total INTEGER,
  assists_season INTEGER,
  assists_total INTEGER,
  gp INTEGER,
  points INTEGER,
  gwg INTEGER,
  ppg INTEGER,
  shg INTEGER,
  pim INTEGER,
  top_scorer_team BOOLEAN,
  top_scorer_league BOOLEAN,
  least_pim_team BOOLEAN,
  most_shots_team BOOLEAN,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
