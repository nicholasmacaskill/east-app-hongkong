---
trigger: always_on
---

{
  "ruleset_name": "East App HK - Max Standard",
  "description": "Agent Orchestration and Safety Protocols for East App HK",
  "rules": [
    {
      "name": "Contextual Alignment",
      "content": "Strictly separate usage of app/lib/supabase.ts (Client/RLS) and app/lib/supabaseAdmin.ts (Admin/Server-only)."
    },
    {
      "name": "Automated Migration Management",
      "content": "Agents must NEVER run raw SQL. Migrations must be TypeScript scripts in /database, executed via npx ts-node."
    },
    {
      "name": "User Role Boundaries",
      "content": "Respect the 4 user roles: sys-admin (full access), coach (team/schedule), parent (payments/permissions), player (read-only stats)."
    },
    {
      "name": "Definition of Done",
      "content": "You MUST check 'project-docs/DEFINITION_OF_DONE.md' before starting and finishing every task. Ensure all mandatory checks are met."
    },
    {
      "name": "Multi-Variate Verification Standard",
      "content": "Any complexity involving multiple system layers (e.g., DB + API, API + UI, Auth + Data) is defined as a 'Multi-Variate Change'. These MUST be verified by a dedicated automated E2E test (Playwright) to ensure integration integrity. Single-layer unit tests are insufficient."
    }
  ],
  "source_of_truth": "AGENTS.md"
}