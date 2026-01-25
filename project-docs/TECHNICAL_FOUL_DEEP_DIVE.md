# Deep Dive: Persistent "Technical Fouls" on Mobile

## Overview
Despite migrating the database to Singapore to resolve latency-based timeouts, users on mobile devices are still reporting "Technical Fouls".

The "Technical Foul" screen is the **Global Error Boundary** defined in `app/error.tsx`. This indicates that the issue is not just a slow request, but an **unhandled exception** that is crashing the React component tree.

## Root Cause Analysis: Why Mobile?
Since the database connection is now fast (~30ms), the errors are likely client-side issues specific to the mobile browser environment or network conditions.

### 1. Network Instability (Unhandled Fetch Rejections)
Mobile networks (4G/5G/Wi-Fi) are prone to intermittent packet loss or switching.
- **The Crash**: If an API call (e.g., `fetch('/api/...')`) fails due to network interrupt and is **not wrapped in a try/catch block** or handled by a query library (like TanStack Query), the promise rejection bubbles up and crashes the app.
- **Why Mobile**: Desktop connections are usually stable stable ethernet/Wi-Fi. Mobile connections drop frequently (elevators, moving between towers).

### 2. Hydration Mismatches (iOS Date Parsing)
React "Hydration Errors" occur when the server-rendered HTML doesn't match the first client-side render.
- **The Crash**: Just one hydration error can cause React to throw an error and trigger the error boundary.
- **Why Mobile (iOS)**:
    - **Date Parsing**: `new Date('2024-01-25 10:00')` works on Chrome/Desktop but often returns `Invalid Date` on Safari/iOS if the format isn't strictly ISO-8601 (T-separated).
    - **Timezones**: Server renders in UTC, mobile renders in local time. If the UI displays a computed date string *immediately* without a "client-only" wrapper, the text mismatch causes a hydration crash.

### 3. Private Browsing / Storage Access
Mobile users often use "Private" or "Incognito" tabs, or have strict privacy settings (blocks third-party cookies).
- **The Crash**: Accessing `localStorage` or `sessionStorage` in these modes can throw a `SecurityError` or `QuotaExceededError` if not handled.
- **Why Mobile**: Safari on iOS is particularly aggressive about blocking storage access in non-standard contexts or webviews.

### 4. Browser Extensions & Overlays
Mobile browsers often have "Reader Views", password managers, or translation overlays that inject DOM elements.
- **The Crash**: If these extensions modify the DOM before React hydrates, it causes a specific hydration mismatch error.

## Remediation Strategy
1.  **Wrap API Calls**: Audit all `useEffect` fetches and ensure they catch errors.
    ```typescript
    // BAD
    const res = await fetch('/api/data');
    const data = await res.json();

    // GOOD
    try {
      const res = await fetch('/api/data');
      if (!res.ok) throw new Error('Failed');
      const data = await res.json();
    } catch (e) {
      // Handle gracefully, don't crash
      setError(true);
    }
    ```
2.  **Fix Date Parsing**: Use a library like `date-fns` or ensure all date strings are standardized (replace spaces with `T`) before passing to `new Date()`.
3.  **Sanitize Storage**: Create a utility hook `useStorage` that wraps `localStorage` access in try/catch blocks.
4.  **Logging**: Add Sentry or client-side logging to the `app/error.tsx` file to capture the *actual* error message and stack trace from mobile users.

## Next Steps
We should prioritize adding **Client-Side Logging** to `app/error.tsx` to get visibility into exactly which of these vectors is causing the crash.
