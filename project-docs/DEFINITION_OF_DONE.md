# DEFINITION OF DONE (Operational Protocol)

This checklist is **MANDATORY** for all future tasks. You must reference this file before starting and before finishing every future task.

## Mandatory Checks

- [ ] **Schema Sync**: Are DB columns, types, and RLS policies updated?
- [ ] **API Logic**: Does the backend route fetch/filter the new data correctly?
- [ ] **Type Safety**: Are the TypeScript interfaces in `app/types.ts` updated to match the DB?
- [ ] **UI Data Flow**: Does the frontend component send the correct parameters to the API?
- [ ] **Regression Audit**: Does this change break other screens (Dashboards, Master Schedules)?
- [ ] **Empty States**: Does the UI handle cases where no data is returned?
