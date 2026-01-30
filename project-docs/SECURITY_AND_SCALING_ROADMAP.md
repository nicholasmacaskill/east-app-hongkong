# 🛡️ Enterprise Security & Hyper-Scale Roadmap

**Strategic Philosophy**: "Paranoid by Default." We assume malicious intent on every request. We optimize for global millisecond-latency at scale using Edge architecture.

---

## � PHASE 1: "The Fortress" (Week 1 - Month 1)
**Objective**: Maximum security immediately. Accept higher friction for non-verified users to guarantee system integrity.

### 1. Zero-Trust Authentication (Immediate)
*   **MFA Enforcement**: Enforce **Multi-Factor Authentication (TOTP)** for ALL `admin` and `coach` accounts immediately. No exceptions.
*   **Session Hardening**: Reduce session Time-To-Live (TTL) to 24 hours. Force re-login for critical actions (e.g., Refunds, Exports).
*   **Role-Based Access Control (RBAC) Audit**: Implement a "Deny-All" RLS policy on Supabase. Only explicitly allowed roles can read/write.

### 2. Aggressive Perimeter Defense
*   **Strict Rate Limiting (Redis)**:
    *   **Login**: 3 failed attempts / 10 mins → 1 hour ban.
    *   **API**: 100 reqs / min for authenticated users; 10 reqs / min for anonymous.
*   **Payload Inspection**: Reject any request body > 50KB to prevent serialization attacks.

### 3. Data Integrity
*   **Point-in-Time Recovery (PITR)**: Enable Supabase PITR to allow restoring the database to *any second* in the last 7 days (Ransomware protection).
*   **Audit Logging**: Log every single `INSERT`, `UPDATE`, `DELETE` operation to a separate, immutable logging table.

---

## � PHASE 2: "Global Edge" (Month 1 - Month 6)
**Objective**: Move compute and data closer to the user to mask physics.

### 1. Edge-First Architecture
*   **Migration**: Move all `GET` API routes to **Vercel Edge Functions**.
*   **Stale-While-Revalidate**: Aggressively cache public data (Schedules, Coaches) on the Edge CDN. Users see instant data while the background updates.

### 2. Database Read Replicas
*   **Architecture**: Spin up a **Read Replica in San Francisco (us-west-1)** and **London (eu-west-2)**.
*   **Routing**: Configure Next.js Middleware to route traffic to the nearest database node based on the user's `x-vercel-ip-country`.

### 3. Automated Quality Assurance
*   **Synthetic Monitoring**: Run headless Playwright scripts every 5 minutes from multiple locations to verify "Can a user book?" logic.
*   **Visual Regression**: Integrate Percy/Chroma to detect pixel-level UI shifts in CI/CD.

---

## ⚛️ PHASE 3: "Hyper-Scale" (Month 6+)
**Objective**: Infinite horizontal scaling and AI-driven defense.


### 2. AI-Driven Threat Detection (Arcjet / FingerprintJS Enterprise)
*   **Behavioral Analysis**: Use AI to analyze mouse movements and typing cadence.
    *   *Human*: Variables speeds, micro-jitters.
    *   *Bot*: Linear movement, instant typing.
*   **Action**: Shadow-ban bots (let them think they succeeded) to prevent them from adapting.

### 3. Database Sharding
*   **Protocol**: If `registrations` table exceeds 10M rows, implement **Tenant-Based Sharding**.
*   **Logic**: Data for "Hong Kong" users lives on Shard A. Data for "UK Expansion" lives on Shard B.
*   **Benefit**: theoretically infinite write-throughput.

---

## 🚨 DEFCON 1: Emergency Protocols

If a sophisticated attack occurs:

1.  **" The Air Gap"**: Rotate ALL `SUPABASE_SERVICE_ROLE_KEY` and Stripe Secrets immediately.
2.  **Circuit Breakers**: Enable code-level switches to disable expensive features (e.g., "Disable Statistics Calculation") to keep the core booking engine alive under load.
3.  **Vercel Attack Mode**: Activate "Under Attack Mode" to force a JavaScript challenge for every single visitor.
