# Bugs Detected in Launch QA

## Resolved Regressions

### 1. Coach Availability / Facility Category Regression
*   **Date**: 2026-01-24
*   **Issue**: Implementation of "Contextual Availability" (Facility vs. Golf) broke the core booking flow by creating "Phantom Sessions" that blocked availability and introducing a `facility_category` column that wasn't consistently supported by the API/UI.
*   **Resolution**:
    *   Full Revert of Codebase to stable commit (`24c9499`).
    *   Revert of Database Schema (Dropped `facility_category` column).
    *   Removal of "Add Coach" UI from Facility Booking Modal.
    *   Purged all experimental API logic.
*   **Status**: **CLEARED**. System restored to "Global Availability" model.
