# East App HK - Comprehensive Testing Guide

## 1. Philosophy: "Robotic Verification"
We do not rely on "it looks good to me." We rely on **automated verification**. For every significant feature or architectural change, we build a "Robot" (a specialized script) that acts as a user to verify the system works as intended.

## 2. The Verification Hierarchy

### Level 1: Static Checks (The Spellchecker)
**Tool:** TypeScript (`npx tsc --noEmit`)
- **What it does:** Checks grammar, spelling, and basic logic.
- **When to run:** Instantly, all the time.
- **Goal:** Catch typos and type mismatches before they run.

### Level 2: Unit Tests (The Component Check)
**Tool:** Jest / Vitest (if applicable)
- **What it does:** Tests purely isolated functions (e.g., "Does the date formatter actually return 'Monday'?").
- **When to run:** When changing utility functions or complex math logic.
- **Goal:** Ensure small blocks are solid.

### Level 3: Multi-Variate E2E Verification (The Robot Inspector)
**Tool:** Playwright (`npx playwright test`)
- **What it does:** Launches a real browser, logs in as a user, clicks buttons, and checks the database.
- **When to run:** **MANDATORY** for any "Multi-Variate Change" (see below).
- **Goal:** Verify that the "Face" (UI) and the "Brain" (Database/API) are talking correctly.

---

## 3. The "Multi-Variate" Rule
**Definition:** A Multi-Variate change is any task that touches **both** the Frontend (what users see) and the Backend (how data is saved).

> **THE RULE:**
> If you make a Multi-Variate Change, you **MUST** create or update a dedicated Playwright test script (`tests/feature-name.spec.ts`).

**Why?**
Because a unit test can pass even if the API is broken. Only a full E2E test proves the system actually works.

## 4. How to Create a Verification Robot

1.  **Identify the User Flow**: "As an Admin, I want to filter the schedule by Coach."
2.  **State the Expectation**: "When I select 'Coach Ben', I should ONLY see Ben's slots."
3.  **Write the Script**:
    -   Setup: Create dummy users (Coach A, Coach B).
    -   Action: Log in, navigate, click filter.
    -   Check: Count the visible items.
    -   Cleanup: Delete the dummy users.

## 5. Definition of Done
Refer to the master checklist in `project-docs/DEFINITION_OF_DONE.md`.
**Summary of the Rule:** You cannot merge or finish a task until the Verification Robot (Playwright) gives you a green light.

## 6. How to Run Tests
- **Run All:** `npx playwright test`
- **Run Specific:** `npx playwright test tests/schedule-visibility.spec.ts`
- **Debug Mode:** `npx playwright test --debug`

## 7. The Feedback Loop: Learning from Failures
Don't just fix the test. Ask **why** it failed to improve our coding approach.

### The "Test Autopsy"
When a verify step fails, categorize it to find the pattern:

1.  **The "Drift" Failure** (Common)
    *   *Symptom:* Test can't find a button because it was renamed/moved.
    *   *Pattern:* UI is changing faster than tests.
    *   *Improvement:* Use **stable data-test-ids** (e.g., `data-testid="submit-btn"`) instead of fragile text selectors.

2.  **The "Logic" Failure** (Critical)
    *   *Symptom:* The robot found data that shouldn't be there (e.g., Ghost Sessions).
    *   *Pattern:* Weak architectural boundaries using loose matching.
    *   *Improvement:* Enforce stricter types (like we did with `Session` vs `Availability`) in the codebase.

3.  **The "Flaky" Failure** (Subtle)
    *   *Symptom:* Fails 10% of the time due to timeouts.
    *   *Pattern:* Race conditions. The app is likely loading data inefficiently.
    *   *Improvement:* Optimize database queries or add better loading states to the UI. Don't just increase the timeout.

### Continuous Standard Refinement
If we encounter a specific failure type >3 times, we must **Update the Orchestration Rules**.
*Example:* If we keep seeing "Login Timeouts", we add a rule: *"Tests must use programmatic auth (cookies), never manual UI login."*
