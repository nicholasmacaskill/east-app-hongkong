# Playwright Testing Standards
**Zero-Tolerance Policy for False Test Failures**

## Mission Statement
Every Playwright test failure must represent a **real bug**, never a test configuration issue. False failures destroy trust in the test suite and waste engineering time.

---

## Mandatory 5-Phase Test Development Process

### Phase 1: UI Discovery (REQUIRED Before Writing ANY Test)

**Rule:** Never write a test selector without first inspecting the actual UI code.

```bash
# Step 1: View the component file
view_file app/components/screens/ComponentName.tsx

# Step 2: Search for exact button/element text
grep -r "button text" app/components/

# Step 3: Check for existing data-testid attributes
grep -r "data-testid" app/components/ComponentName.tsx
```

**Checklist:**
- [ ] Component file viewed and understood
- [ ] Exact button/element text identified
- [ ] Element structure (button, input, div) confirmed
- [ ] Existing data-testid attributes catalogued

---

### Phase 2: Selector Strategy Selection

**Priority Order (from most reliable to least):**

1. **`data-testid`** (Best - immune to UI changes)
   ```typescript
   page.locator('[data-testid="add-child-btn"]')
   ```

2. **Playwright Built-in Selectors** (Good - semantic and flexible)
   ```typescript
   page.getByRole('button', { name: /register.*athlete/i })
   page.getByLabel('Email Address')
   page.getByPlaceholder('Search...')
   ```

3. **Text Content with Regex** (Acceptable - allows minor variations)
   ```typescript
   page.locator('text=/Register.*Athlete/i')
   ```

4. **Exact Text Match** (Last Resort - brittle)
   ```typescript
   page.locator('button:has-text("+ Register New Athlete")')
   ```

**Rule:** If using exact text match, document why in a comment.

---

### Phase 3: Single-Test Development

**Rule:** Write ONE test at a time. Run it. Verify it passes. Then write the next one.

```typescript
// ✅ CORRECT: Write one test
test('Player cannot see Add Child button', async ({ page }) => {
  await page.goto('/login');
  // ... test logic
});

// Run ONLY this test
// npx playwright test --grep "Player cannot see"
```

```typescript
// ❌ WRONG: Writing 8 tests without running any
test('Test 1', async ({ page }) => { /* ... */ });
test('Test 2', async ({ page }) => { /* ... */ });
test('Test 3', async ({ page }) => { /* ... */ });
// ... 5 more tests
// Then run all and get 8 failures
```

---

### Phase 4: Validation in Headed Mode

**Rule:** Every new test MUST pass in headed mode before proceeding.

```bash
# Run in headed mode with debug
npx playwright test --grep "Test name" --headed --debug

# Watch the browser execute
# Verify each action completes
# If it fails, FIX IT before writing more tests
```

**Validation Checklist:**
- [ ] Test runs without errors in headed mode
- [ ] All selectors find their elements
- [ ] Assertions pass with correct expected values
- [ ] No timeouts or race conditions

---

### Phase 5: Data-TestID Enforcement (For Critical Paths)

**Rule:** Critical features (auth, payments, bookings, role permissions) MUST use `data-testid`.

**Add to component:**
```tsx
// ParentProfile.tsx
<button 
  data-testid="add-child-btn"
  onClick={() => setShowAddChild(true)}
>
  + Register New Athlete
</button>
```

**Use in test:**
```typescript
await page.locator('[data-testid="add-child-btn"]').click();
```

**Critical Paths Requiring data-testid:**
- [ ] Login/Logout buttons
- [ ] Payment/Checkout forms
- [ ] Booking/Cancellation actions
- [ ] Role-specific UI elements
- [ ] Admin-only functionality

---

## Test Certification Checklist (Before Committing)

Before ANY test is committed to git:

- [ ] UI discovery phase completed (component inspected)
- [ ] Selector strategy documented (why this selector was chosen)
- [ ] Test passes in headed mode (visually verified)
- [ ] Test passes in headless mode (CI-ready)
- [ ] No hardcoded waits (use Playwright auto-waiting)
- [ ] Error messages are descriptive
- [ ] Test is idempotent (can run multiple times)
- [ ] Test data is cleaned up (in `afterAll`)

---

## Anti-Patterns to Avoid

### ❌ Writing Tests Without UI Inspection
```typescript
// WRONG: Guessing button text
await page.click('button:has-text("Add Child")');
// Reality: Button says "+ Register New Athlete"
```

### ❌ Hardcoded Waits
```typescript
// WRONG: Arbitrary timeout
await page.waitForTimeout(5000);

// CORRECT: Wait for specific condition
await page.waitForSelector('[data-testid="modal"]');
```

### ❌ Committing Failing Tests
```bash
# WRONG: "I'll fix it later"
git commit -m "Add tests (6 failing, will fix)"

# CORRECT: Only commit passing tests
# Fix failures FIRST, then commit
```

### ❌ Overly Specific Selectors
```typescript
// WRONG: Will break if structure changes
page.locator('div > div > button.class-name')

// CORRECT: Use semantic selectors
page.getByRole('button', { name: 'Submit' })
```

---

## Playwright Codegen Workflow

For complex interactions, use Playwright's code generator:

```bash
# Start dev server
npm run dev

# Open Codegen
npx playwright codegen http://localhost:3000

# Manually perform the actions you want to test
# Playwright generates code with EXACT selectors from your DOM
# Copy/paste into your test file
```

**When to use Codegen:**
- Complex multi-step flows
- Unfamiliar UI components
- Need exact selectors quickly
- Debugging why a test is failing

---

## Auditor's Role

The **Auditor agent** is responsible for:

1. **Pre-Test Review:** Before any test is written, Auditor must verify UI components exist and identify correct selectors
2. **Test Validation:** Run tests in headed mode and confirm they pass
3. **Selector Approval:** Ensure tests use appropriate selector strategy (data-testid for critical paths)
4. **Zero-Failure Enforcement:** No test is committed unless it passes 100%
5. **Documentation:** Maintain a test coverage map in `project-docs/TEST_COVERAGE.md`

**Auditor Workflow:**
```
1. Developer requests Playwright test
2. Auditor inspects target UI components
3. Auditor identifies correct selectors
4. Auditor writes ONE test
5. Auditor runs test in headed mode
6. If PASS: Auditor writes next test
7. If FAIL: Auditor debugs and fixes BEFORE proceeding
8. Repeat until all tests pass
9. Auditor commits tests with certification checklist
```

---

## Test Maintenance

### When UI Changes
1. Locate affected tests (grep for old text/selector)
2. Update selectors to match new UI
3. Re-run tests to verify
4. Update test documentation

### When Tests Become Flaky
1. Investigate root cause (race condition? timing issue?)
2. Add proper waits (`waitForSelector`, not `waitForTimeout`)
3. Consider adding `data-testid` for stability
4. Document flakiness in test comment if unavoidable

### Quarterly Test Audit
- Review all tests for outdated selectors
- Migrate text-based selectors to data-testid
- Remove tests for deprecated features
- Update test documentation

---

## Success Metrics

**Test Suite Health:**
- ✅ 100% test pass rate on main branch
- ✅ Zero false failures in CI pipeline
- ✅ All critical paths have data-testid coverage
- ✅ Test execution time < 5 minutes for full suite

**When Failures Occur:**
- ❌ False failure = Process violation, must be addressed immediately
- ✅ Real failure = Bug found, exactly what tests are for

---

## Related Documents
- [AGENTS.md](./AGENTS.md) - Agent orchestration rules
- [BUGS_DETECTED_IN_LAUNCH_QA.md](./BUGS_DETECTED_IN_LAUNCH_QA.md) - Known issues
- Database schema: `database/schema.sql`

---

**Version:** 1.0  
**Last Updated:** 2026-01-20  
**Owner:** Auditor Agent
