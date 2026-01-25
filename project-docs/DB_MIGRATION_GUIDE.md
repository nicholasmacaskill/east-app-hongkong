# Database Migration: Region Optimization

## Overview
On **January 24, 2026**, the project's primary Supabase database was migrated from the US West (Oregon) region to **Southeast Asia (Singapore)**.

## Rationale: Why Migrate?
The primary driver for this migration was **latency reduction** and resolving persistent **"Technical Fouls"**.

- **Latency & Technical Fouls**: Hosting in Oregon (US-West) for a Hong Kong user base resulted in 150-200ms of base latency. This led to:
    - **Request Timeouts**: Critical database operations intermittently timing out before completion.
    - **Race Conditions**: High latency increased the "vulnerability window" for concurrent transactions, causing atomic operations to occasionally fail or result in inconsistent states.
    - **Connection Instability**: Increased risk of dropped connections over the long geographic distance.
- **User Location**: Aligning the database with the Southeast Asia region (Singapore) brings latency down to ~30ms, effectively eliminating these timeout-related "fouls".
- **Performance**: Significant improvement in the "snappiness" of the UI and the reliability of real-time features.

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
