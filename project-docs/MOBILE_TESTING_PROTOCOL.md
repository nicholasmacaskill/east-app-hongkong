# Mobile Testing & Optimization Protocol

This document defines the automated process for ensuring the East App HK provides a premium mobile experience.

## Overview

The mobile optimization audit is an **automated Playwright suite** that crawls every accessible route in the application across three primary mobile viewports. It goes beyond functional testing, performing a "Heuristic Health Check" on the UI.

## The Automated Audit Process

### 1. Route Discovery
The system automatically identifies all routes in the `app/` directory (e.g., `/sys-admin/schedule`, `/coach/dashboard`). It filters out dynamic paths that require specific IDs unless provided in a test manifest.

### 2. Viewport Matrix
Every discovered route is tested against:
- **iPhone SE** (320x568) - Constraint testing.
- **iPhone 13/14** (390x844) - Standard iOS testing.
- **Pixel 5** (393x851) - Standard Android testing.

### 3. Heuristic Engine (The "Deep Scan")
For every page, the script executes a custom `MobileAuditEngine` that evaluates:

| Category | Check | Goal |
| :--- | :--- | :--- |
| **Layout** | Overflow Detection | Ensures no horizontal scrolling (`scrollWidth <= innerWidth`). |
| **CSS** | Fixed-Width Audit | Flags `px` widths that should be `%` or `vw`. |
| **CSS** | Stacking Audit | Identifies `flex-row` layouts that should stack on mobile. |
| **UX** | Touch Target Size | Verifies all buttons/links are at least 44x44px. |
| **UX** | keyboard Collision | Ensures inputs aren't hidden by the virtual keyboard. |
| **Perf** | CLS Monitoring | Detects "Layout Shift" during loading on slow networks. |

## Running the Audit

The audit is run via the CLI. It runs in **Headless Mode** by default, meaning no browser windows will pop up on your screen during the test. It generates a visual HTML report with "Before/After" diffs for any layout regressions.

```bash
# Run the full mobile audit (Headless/Background)
npx playwright test tests/mobile-system-audit.spec.ts
```

## Maintenance

- **Adding Exclusions**: If a specific page is intentionally desktop-only, add it to the `EXCLUSIONS` array in `tests/utils/mobile-audit-engine.ts`.
- **Updating Baselines**: Use `npx playwright test --update-snapshots` if intentional UI changes are made.
