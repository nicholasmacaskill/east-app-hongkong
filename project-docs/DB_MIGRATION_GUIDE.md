# Database Migration: Region Optimization

## Overview
On **January 24, 2026**, the project's primary Supabase database was migrated from the US West (Oregon) region to **Southeast Asia (Singapore)**.

## Rationale: Why Migrate?
The primary driver for this migration was **latency reduction**.
- **User Location**: As East App HK serves users primarily in Hong Kong, hosting the database in Oregon (US-West) introduced a minimum of 150-200ms of round-trip latency for every database query.
- **Performance**: Moving to the Singapore region reduces this latency to ~30-50ms for users in Hong Kong, significantly improving the responsiveness of the application and the "snappiness" of the UI.
- **Server Parity**: Aligning the database region with the target user base ensures better performance for real-time features and Edge Functions.

## Migration Details
- **Source Project**: `hxbsnplotkiohcbmvsjf` (Oregon)
- **Target Project**: `ktlicvvczrlppqkcqedv` (Singapore)
- **Scope**: Schema structure and `public` schema data records.

### Technical Steps Taken
1.  **Extension Audit**: Verified and enabled required extensions on the new project (including `pg_net` and `uuid-ossp`).
2.  **Schema Migration**: Used Supabase CLI (`db pull` / `db push`) to transfer all tables, views, functions, and RLS policies.
3.  **Data Transfer**: Dumped all public records from the source and applied them to the target via a standardized SQL migration, handling foreign key dependencies by temporarily disabling triggers.
4.  **Admin Recovery**: Created a new system administrator user (`admin@east.com`) to allow immediate testing on the fresh instance.
5.  **Environment Update**: Updated `.env.local` and Vercel configuration to point to the new Singapore endpoints.

## Post-Migration Verification
- [x] Verified table counts (e.g., ~3400 session records transferred).
- [x] Confirmed extension parity.
- [x] Validated admin login and profile role assignment.

---
*Last Updated: 2026-01-24*
