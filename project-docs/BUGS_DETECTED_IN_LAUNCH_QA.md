# Bugs Detected in Launch QA

## Resolved Issues

### 1. Generic Membership Success Experience
*   **Issue:** After purchasing a membership, users were redirected to the generic `/?success=true` state, which felt impersonal and didn't confirm their specific "Member" status.
*   **Fix:**
    *   Created `app/membership/success/page.tsx` with a verified "Welcome to the Team" message.
    *   Updated `app/api/checkout/route.ts` to strictly redirect `subscription` mode functions to this new dedicated page.

### 2. Missing Top-up Feedback
*   **Issue:** Credit "Top-up" transactions (which stay on the same page) used a browser native `alert()` which felt jarring and unpolished.
*   **Fix:**
    *   Replaced the native `alert` with a custom `Toast` notification (green "success" popup) triggered when `?success=true` is present in the URL.
    *   Wrapped the main app in `ToastProvider` to ensure notifications work globally.

### 3. Admin Directory Usability
*   **Issue:** Role color coding was inconsistent (Admins and Parents overlapped colors) or incorrect (Athletes showing as Orange instead of Green). Additionally, the "Unassigned Athletes" button was just a visual counter, not a functional filter, making these users hard to find.
*   **Fix:**
    *   Updated color coding for better hierarchy: Coaches (Blue), Parents (Purple), Admins (Rose), Athletes (Green).
    *   Implemented a dedicated `Unassigned` tab filter. Clicking the "Unassigned" tile now filters the list to show *only* athletes who need parent assignment.

### 4. Admin Services Layout
*   **Issue:** The "Edit/Add Service" modal was not scrollable. On smaller screens or when adding photos, the "Submit" button would get pushed off-screen, making it impossible to save changes.
*   **Fix:**
    *   Added robust scrolling (`max-h-[90vh]` + `overflow-y-auto`) to the service modal.
    *   Ensured the "Submit" button is always reachable regardless of screen height.

### 5. Coach Assignment Logic
*   **Issue:** The booking modal was displaying all instructors, even those not assigned to the selected service (e.g., showing a Soccer coach when a Hockey service was selected). This occurred because the filtering relied on generic "Instructor" text matching rather than database relationships.
*   **Fix:**
    *   Updated `HomeScreen.tsx` to pass the specific `serviceId` to the booking modal.
    *   Modifed `ClassModal.tsx` to strictly filter the instructor list by cross-referencing the `coach_services` table.
    *   Result: Only coaches explicitly assigned to the service are now displayed.

### 6. Account Unlock Logic
*   **Issue:** Users remained "LOCKED" overlay even after Admins manually extended their membership dates.
*   **Fix:**
    *   **Frontend Check:** Updated `AppHeader.tsx` to respect `account_status: 'active'` (previously it only checked subscription status).
    *   **Backend Update:** Modified `app/sys-admin/directory/page.tsx` to automatically set `account_status = 'active'` whenever an admin saves a profile with a valid future membership expiry date.
    *   Result: Manual admin "reactivations" now instantly unlock the user app.

### 7. Coach Grid Slot Creation
*   **Issue:** In the Admin Schedule, clicking on an empty grid slot opened a generic session creator that sometimes defaulted to "Facility" or "Class" types, making it confusing to create specific "Private Coach" slots quickly.
*   **Fix:**
    *   Updated `ScheduleScreen.tsx` to ensure clicking a time slot explicitly defaults the new session to `category: 'PRIVATE'` and checks if a specific instructor is being viewed to auto-assign them.

### 8. Admin Calendar Date Picker
*   **Issue:** The date picker input on the Desktop Admin view was white-on-white (invisible icon) due to browser defaults on dark mode.
*   **Fix:**
    *   Applied `color-scheme: dark` and an inverted filter to the date input class to ensure the calendar icon is clearly visible against the dark UI.

### 9. Orphan Session Sync
*   **Issue:** "Orphan" private sessions (created manually by Admins without a specific Service Type ID) were being filtered out of the Athlete Home Screen.
*   **Fix:**
    *   Added logic to `HomeScreen.tsx` to detect sessions with `category: 'PRIVATE'` but no `session_type_id`.
    *   Dynamically generates a "Private Coaching" generic tile if one doesn't exist, ensuring these custom sessions are clickable and bookable.

### 10. Transaction History Visibility
*   **Issue:** Recent payments were not appearing in the user's "Recent Activity" log despite being processed correctly. Additionally, the modal's Close button was invisible on the dark background.
*   **Fix:**
    *   **Data Fetching:** Updated `api/user/transactions` to use `supabaseAdmin` instead of the user client. This ensures the backend can always read the user's transaction history, even if strict Row Level Security (RLS) policies on the `transactions` table (intended to block public access) were accidentally blocking the user themselves.
    *   **UI:** Updated the Close button style to white-on-transparent with a hover effect for clear visibility.
