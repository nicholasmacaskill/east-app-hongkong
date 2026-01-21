# East App HK: Triangular Orchestration Manual

## Technical Stack
- **Frontend:** Next.js 16 (App Router).
- **Backend/Auth:** Supabase (PostgreSQL). Use `app/lib/supabase.ts` for Client/RLS and `app/lib/supabaseAdmin.ts` for Server/Admin tasks.
- **Payments:** Stripe.
- **Background Tasks:** Inngest.
- **Roles:** `player`, `parent`, `coach`, `admin`.

## The Three-Agent Team

### 1. Agent A: Antigravity (The Executor & QA)
- **Role:** Handles UI implementation, frontend verification, and terminal commands.
- **Workflow:** Builds components, runs `npm run build`, fixes type errors.

### 2. Agent B: The Architect (CLI/IDE)
- **Role:** Handles high-density reasoning, backend logic, and file generation.
- **Workflow:** Type **`@Architect`** in chat to trigger planning phase.
- **Focus:** API routes, database migrations, Inngest jobs.

### 3. Agent C: The Auditor (IDE)
- **Role:** Dedicated Security, Logic, and Test Quality Auditor.
- **Workflow:** Type **`@Auditor`** in chat to trigger security review or test validation.
- **Focus:**  
  - RLS bypasses and permissions (`app/types.ts`)
  - Security vulnerabilities and role-based access control
  - **Playwright Test Oversight:** Enforces zero-tolerance policy for false test failures
  - Pre-test UI inspection to ensure correct selectors before test creation
  - Test validation in headed mode before committing
  - Mandatory `data-testid` enforcement for critical paths (auth, payments, bookings)
- **Standards:** See [PLAYWRIGHT_TESTING_STANDARDS.md](./PLAYWRIGHT_TESTING_STANDARDS.md)

## 🏛️ The Council Workflow (Single Window)
You can command the entire team from a single chat window using **Tags**:

1.  **`@Architect [Request]`**: The Architect will analyze and plan the solution.
2.  **`@Auditor [Request]`**: The Auditor will review the plan/code for safety.
3.  **`@Council [Request]`**: Trigger the Full Chain: **Architect -> Auditor -> Executor**.
    *   *Step 1:* Architect creates the Plan.
    *   *Step 2:* Auditor approves the Plan.
    *   *Step 3:* Executor (Antigravity) implements it.

## Agent Reality Breakdown
- **Physically**: One IDE Chat Window.
- **Logically**: 3 Distinct "Personas" loaded sequentially.
- **Enforcement**: All agents must adhere to `AI_GUIDELINES.md`.

## Safety Protocol: No Direct SQL
- Agents are FORBIDDEN from running raw SQL.
- All database changes must be written as TypeScript scripts in `/database` (e.g., similar to `database/seed.ts`).
- A human developer must manually execute migrations using `npx ts-node`.
