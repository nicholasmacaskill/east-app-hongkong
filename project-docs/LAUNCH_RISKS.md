# Pre-Launch Risk & Vulnerability Assessment

This document outlines potential edge cases, vulnerabilities, and user experience friction points identified during development. These are **not** currently active bugs, but rather "what-if" scenarios to monitor or mitigate before a full public launch.

## 1. Stripe Webhook Latency (Panic Factor)
*   **UX Criticality**: **10/10** (Severe)
*   **Why**: Money requires absolute trust.
*   **Regression Risk**: **Medium**. Implementing "Optimistic UI" (showing credits immediately before webhook confirms) adds complex state management. If the webhook *actually fails*, you have to "rollback" the credits, which is confusing.
*   **Tech Debt**: **Medium**. It bifurcates the "Source of Truth" between the Server (Real) and Client (Optimistic).

## 2. Concurrency & Booking Races (Overbooking) **[RESOLVED]**
*   **UX Criticality**: **9/10** (High)
*   **Why**: Real-world embarrassment.
*   **Regression Risk**: **Low**. Adding a Database `CHECK` constraint or Trigger is the "Correct" way to do this. It keeps data pure.
*   **Tech Debt**: **Low**. In fact, *not* fixing this is higher debt.
*   **Status**: **RESOLVED**. Added `max_capacity` column to sessions table (default: 12) with database constraint. Updated `book_session_with_credits()` function to enforce capacity limits and return clear error messages when sessions are full.

## 3. Timezone "Day Boundary" Drift
*   **UX Criticality**: **8/10** (High)
*   **Why**: Missed classes.
*   **Regression Risk**: **High**. Date/Time handling is fragile. Forcing "HK Time" globally might break functionality for legitimate international use cases (e.g., an Admin in London coordinating schedules). It requires rigorous testing.
*   **Tech Debt**: **Low**. Moving to a consistent "Timezone Aware" library pattern (like `date-fns-tz`) reduces debt long-term.

## 4. Child / Parent Role Ambiguity
*   **UX Criticality**: **7/10** (Moderate-High)
*   **Why**: Wrong attendance sheets.
*   **Regression Risk**: **Low**. This is mostly cleaning up UI logic/state selectors.
*   **Tech Debt**: **Negative**. Fixing this *reduces* debt by making the code's intent clearer.

## 5. Orphaned "Ghost" Sessions
*   **UX Criticality**: **6/10** (Moderate)
*   **Why**: Unprofessional.
*   **Regression Risk**: **Medium**. `ON DELETE CASCADE` is dangerous if not careful—you might accidentally wipe out months of historical "Financial Transaction" logs if they are strictly linked to that Coach ID.
*   **Tech Debt**: **Low**.

## 6. Mobile "Pull-to-Refresh" Clashing **[RESOLVED]**
*   **UX Criticality**: **5/10** (Moderate)
*   **Why**: Annoying.
*   **Regression Risk**: **Zero**. Fixed via `overscroll-behavior-y: none` in `globals.css`.
*   **Tech Debt**: **Zero**.

## 7. CSV / Formula Injection **[RESOLVED]**
*   **UX Criticality**: **2/10** (Low)
*   **Why**: Security risk.
*   **Regression Risk**: **Zero**. Implemented `sanitize()` helper in CSV export logic.
*   **Tech Debt**: **Zero**.

## 8. Admin Credential Reset Scripts **[RESOLVED]**
*   **UX Criticality**: **1/10** (Invisible)
*   **Why**: Backend security risk.
*   **Regression Risk**: **Zero**. Safely deleted `database/fix_admin.ts` and `scripts/rescue_admin.ts`.
*   **Tech Debt**: **Negative** (Codebase cleanup).

## 9. Auth Token Expiry (Silent Failure)
*   **UX Criticality**: **8/10** (High)
*   **Why**: A user leaving the tab open for 24+ hours and then clicking "Book" will likely fail if the refresh token logic isn't perfect.
*   **Regression Risk**: **Low**. Standard interceptor fix.
*   **Tech Debt**: **Medium**.

## 10. Email Deliverability (Sender Restriction) **[RESOLVED]**
*   **UX Criticality**: **10/10** (Catastrophic)
*   **Why**: The code was restricted to `onboarding@resend.dev`.
*   **Regression Risk**: **Low**. Standard configuration task.
*   **Tech Debt**: **Low**.
*   **Status**: **RESOLVED**. API Key updated and `from` address switched to `onboarding@eastsportsgroup.com`. verified domain active.

## 11. Stale Cache / Realtime Gaps
*   **UX Criticality**: **6/10** (Moderate)
*   **Why**: Users hate clicking "Book" only to find it's actually full.
*   **Regression Risk**: **Medium**. Realtime adds complexity.
*   **Tech Debt**: **Medium**.

## 12. Unoptimized Media Uploads
*   **UX Criticality**: **4/10** (Performance)
*   **Why**: Massive photos destroy load times and data plans.
*   **Regression Risk**: **Low**. Image resizing functions are safe.
*   **Tech Debt**: **Low**.

## 13. Deep Link Context Loss
*   **UX Criticality**: **5/10** (Friction)
*   **Why**: Links should take users where they expect *after* login.
*   **Regression Risk**: **Medium**. Requires careful auth param handling.
*   **Tech Debt**: **Low**.
