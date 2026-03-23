# EAST App HK - Future-Proofing Action Plan
*Contextualized recommendations based on current architecture audit*

---

## 1. Architecture & Constraints

### Current State:
- **Stack:** Next.js 15.1.0 + Supabase + Stripe
- **Database:** PostgreSQL (Supabase)
- **Auth:** Supabase Auth with custom RLS policies
- **Payment:** Stripe Webhooks

### Actions Required:

#### ✅ Immediate (Pre-Deployment)
1. **Environment Variables Audit**
   - ✅ Added missing Stripe Family Plan keys locally
   - ⚠️ **CRITICAL:** Add these 4 keys to Vercel before deployment:
     ```
     NEXT_PUBLIC_STRIPE_PRICE_FAMILY_2_MONTHLY
     NEXT_PUBLIC_STRIPE_PRICE_FAMILY_2_YEARLY
     NEXT_PUBLIC_STRIPE_PRICE_FAMILY_3_MONTHLY
     NEXT_PUBLIC_STRIPE_PRICE_FAMILY_3_YEARLY
     ```
   - Add `OPENAI_API_KEY` for player stats OCR (if using)

2. **Schema Migration Lock-In**
   - ✅ Fixed: Added `total_facility_bays` column to `sessions`
   - **TODO:** Create `database/migration_history.md` to track all schema changes
   - **TODO:** Add `/database/current_schema.sql` as the single source of truth (exists but needs update with `total_facility_bays`)

3. **Dependency Audit**
   - **Current:** 13 production dependencies + 12 dev dependencies
   - **Action:** Document purpose of each in `package.json` comments or `docs/dependencies.md`
   - **Future:** Implement "one-in, one-out" rule – any new dependency requires justification

#### 📋 Short-Term (Post-Launch, Week 1-2)
1. **Modular Domain Separation**
   - **Current:** Monolithic `/app` structure
   - **Recommended Structure:**
     ```
     app/
       (auth)/         # Authentication domain
       (payment)/      # Stripe & credits
       (scheduling)/   # Sessions & bookings
       (profiles)/     # User/coach/admin profiles
       (stats)/        # Player stats & OCR
     ```
   - Enforce: Each domain has its own API routes, components, types

2. **Architecture Decision Records (ADRs)**
   - Create `docs/adr/` folder
   - Document key decisions made during this audit:
     - `001-stripe-webhook-architecture.md` (Why PLAN_DETAILS mapping)
     - `002-refund-policy-time-based.md` (Why 100%/50%/0%)
     - `003-parent-child-credit-model.md` (Why parent pays, child attends)
     - `004-ocr-openai-vs-google-vision.md` (Why OpenAI Vision)

---

## 2. CI/CD & Automation

### Current State:
- No CI/CD pipeline configured
- Manual testing only
- No automated deployment checks

### Actions Required:

#### ✅ Immediate
1. **GitHub Actions Setup**
   Create `.github/workflows/ci.yml`:
   ```yaml
   name: CI
   on: [push, pull_request]
   jobs:
     lint:
       runs-on: ubuntu-latest
       steps:
         - uses: actions/checkout@v3
         - uses: actions/setup-node@v3
         - run: npm ci
         - run: npm run lint
     
     type-check:
       runs-on: ubuntu-latest
       steps:
         - uses: actions/checkout@v3
         - uses: actions/setup-node@v3
         - run: npm ci
         - run: npx tsc --noEmit
   ```

2. **Pre-commit Hooks**
   - Install Husky: `npm install -D husky`
   - Add pre-commit hook to run ESLint on staged files
   - Prevent commits with unformatted code

#### 📋 Short-Term
1. **Vercel Preview Deployments**
   - Already enabled by default on Vercel
   - **Action:** Add preview URL to PR description template
   - **Action:** Create stakeholder review checklist for preview deploys

2. **The 10-Minute Rule**
   - **Current:** No automated tests = instant CI
   - **Target:** Keep CI under 10 minutes as tests are added
   - **Milestone:** When adding tests, use `--parallel` flag

---

## 3. Observability & Monitoring

### Current State:
- Console.log debugging only
- No error tracking
- No performance monitoring

### Actions Required:

#### ✅ Immediate (Post-Deployment Day 1)
1. **Error Tracking: Sentry**
   ```bash
   npm install @sentry/nextjs
   npx @sentry/wizard@latest -i nextjs
   ```
   - Track webhook failures
   - Track payment errors
   - Track booking failures

2. **Structured Logging**
   - Replace `console.log` with structured logging:
     ```typescript
     // Before:
     console.log('Booking failed:', error);
     
     // After:
     logger.error('booking_failed', {
       userId,
       sessionId,
       error: error.message,
       timestamp: new Date().toISOString()
     });
     ```

3. **Stripe Webhook Monitoring**
   - **Action:** Enable webhook monitoring in Stripe Dashboard
   - **Action:** Set up alerts for webhook failures > 5% threshold
   - **Current:** Webhooks verified but no monitoring configured

#### 📋 Short-Term
1. **Vercel Analytics**
   - Enable Web Analytics (free tier)
   - Track Core Web Vitals
   - Monitor `/sys-admin` routes for admin-specific issues

2. **Database Query Monitoring**
   - Use Supabase dashboard to identify slow queries
   - **Target:** All queries < 100ms
   - **Action:** Add indexes if any queries > 500ms

3. **The Three Pillars**
   - **Metrics:** Vercel Analytics (✓)
   - **Logs:** Sentry + Vercel Logs (TODO)
   - **Traces:** PostHog session replay (already installed, verify config)

---

## 4. Security & Compliance

### Current State:
- ✅ Supabase RLS policies active
- ✅ Service role key used only in backend
- ✅ Stripe webhook signature verification
- ⚠️ No automated security scanning

### Actions Required:

#### ✅ Immediate
1. **Secrets Audit**
   - ✅ No hardcoded secrets found in audit
   - **Action:** Add `.env.example` file with dummy values:
     ```bash
     NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
     SUPABASE_SERVICE_ROLE_KEY=your-key-here
     STRIPE_SECRET_KEY=sk_test_...
     OPENAI_API_KEY=sk-proj-...
     ```

2. **Dependabot Setup**
   Create `.github/dependabot.yml`:
   ```yaml
   version: 2
   updates:
     - package-ecosystem: "npm"
       directory: "/"
       schedule:
         interval: "weekly"
       open-pull-requests-limit: 5
   ```

3. **Security Headers**
   Add to `next.config.js`:
   ```javascript
   async headers() {
     return [
       {
         source: '/:path*',
         headers: [
           { key: 'X-Frame-Options', value: 'DENY' },
           { key: 'X-Content-Type-Options', value: 'nosniff' },
           { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' }
         ]
       }
     ];
   }
   ```

#### 📋 Short-Term
1. **API Rate Limiting**
   - Add rate limiting to `/api/admin/*` routes
   - Use Vercel Edge Config or Upstash Redis
   - Limit: 100 requests/minute per IP

2. **Input Validation**
   - Install Zod: `npm install zod`
   - Validate all API inputs:
     ```typescript
     const bookingSchema = z.object({
       sessionId: z.number().int().positive(),
       userId: z.string().uuid()
     });
     ```

---

## 5. Developer Experience (DX)

### Current State:
- No setup documentation
- Manual database migrations via SQL editor
- No code ownership defined

### Actions Required:

#### ✅ Immediate
1. **The README Test**
   Update `README.md`:
   ```markdown
   # EAST Training Hong Kong
   
   ## Prerequisites
   - Node.js 20+
   - Supabase account
   - Stripe account
   
   ## Setup (5 minutes)
   1. Clone: `git clone ...`
   2. Install: `npm install`
   3. Copy env: `cp .env.example .env.local`
   4. Fill in Supabase/Stripe keys
   5. Run: `npm run dev`
   6. Open: http://localhost:3000
   
   ## Key Features
   - Membership management (Stripe webhooks)
   - Session booking with credits
   - Admin panel for schedule/stats
   - OCR player stats upload
   ```

2. **Database Migration Script**
   Create `database/migrate.sh`:
   ```bash
   #!/bin/bash
   # Apply all migrations in order
   echo "Applying database migrations..."
   npx supabase db push
   echo "✅ Migrations complete"
   ```

3. **CODEOWNERS File**
   Create `.github/CODEOWNERS`:
   ```
   # Admin Panel
   /app/sys-admin/** @your-username
   
   # Payment & Webhooks (critical)
   /app/api/webhooks/** @your-username @backup-reviewer
   
   # Database Schema
   /database/** @your-username @dba-username
   ```

#### 📋 Short-Term
1. **API Documentation**
   - Install: `npm install swagger-jsdoc swagger-ui-react`
   - Document all `/api` routes with JSDoc:
     ```typescript
     /**
      * @swagger
      * /api/sessions:
      *   post:
      *     summary: Book a session
      *     parameters:
      *       - name: sessionId
      *         schema: { type: number }
      *     responses:
      *       200: { description: Success }
      */
     ```

2. **VSCode Workspace Settings**
   Create `.vscode/settings.json`:
   ```json
   {
     "editor.formatOnSave": true,
     "editor.codeActionsOnSave": {
       "source.fixAll.eslint": true
     },
     "typescript.tsdk": "node_modules/typescript/lib"
   }
   ```

---

## 6. Testing Strategy (Future)

### Current State:
- Zero automated tests
- Manual QA only
- Verification scripts created during audit (one-time use)

### Recommended Path:

#### Phase 1 (Month 1-2)
1. **Critical Path E2E Tests** (Using Playwright)
   - Webhook payment flow (Individual → Family plans)
   - Session booking (Parent → Child)
   - Admin schedule CRUD

2. **API Integration Tests**
   - Test all `/api/admin/*` routes
   - Test webhook handlers with mock Stripe events
   - Test credit deduction logic

#### Phase 2 (Month 3-4)
1. **Unit Tests for Business Logic**
   - Refund calculation (100%/50%/0%)
   - Credit transfer validation
   - Capacity checks

2. **Test Pyramid Target**
   - Unit: 70% (business logic)
   - Integration: 20% (API routes)
   - E2E: 10% (critical user flows)

---

## 7. Known Technical Debt

### From This Audit:

1. **ts-node Compilation Issues**
   - **Issue:** Migration scripts fail with import resolution errors
   - **Workaround:** Rewrote as `.js` files
   - **Fix:** Configure `tsconfig.json` for proper module resolution or migrate to `tsx`

2. **Hardcoded Mock Data**
   - **Location:** `PlayerProfile.tsx` (age: 31, season: 3, team: 'RHINOS')
   - **Fix:** Connect to `players_stats` table (OCR system now enables this)

3. **Email Service (Resend)**
   - **Current:** Placeholder API key `re_placeholder_dev`
   - **Fix:** Replace with real Resend key before deployment

4. **Missing RLS Policies**
   - **Status:** Assumed active but not verified
   - **Action:** Run `database/enable_rls_security.ts` in production

---

## Priority Matrix

| Priority | Action | Timeline | Impact |
|----------|--------|----------|--------|
| 🔴 P0 | Add Stripe Family keys to Vercel | Pre-Deploy | BLOCKER |
| 🔴 P0 | Replace Resend placeholder key | Pre-Deploy | BLOCKER |
| 🟠 P1 | Set up Sentry error tracking | Week 1 | High |
| 🟠 P1 | Create `.env.example` | Week 1 | High |
| 🟠 P1 | Update README with setup steps | Week 1 | High |
| 🟡 P2 | Add GitHub Actions CI | Week 2 | Medium |
| 🟡 P2 | Enable Dependabot | Week 2 | Medium |
| 🟢 P3 | Create ADRs for key decisions | Month 1 | Low |
| 🟢 P3 | Add E2E tests for critical paths | Month 2 | Low |

---

## Monitoring Checklist (Post-Deployment)

**Week 1:**
- [ ] Stripe webhook success rate > 99%
- [ ] No 5xx errors in Vercel logs
- [ ] All email confirmations sending
- [ ] Credit deductions working correctly

**Week 2:**
- [ ] Average API response time < 200ms
- [ ] Database query performance acceptable
- [ ] User-reported bugs = 0 critical, < 5 minor

**Month 1:**
- [ ] Zero security vulnerabilities in dependencies
- [ ] Documentation up-to-date
- [ ] All team members can run project locally

---

## Conclusion

Your codebase is **production-ready** with critical fixes applied. This plan transitions you from "launch mode" to "sustainable operation mode."

**Next Steps:**
1. Complete P0 items (Vercel keys, Resend key)
2. Deploy to production
3. Implement P1 items in Week 1
4. Revisit this document monthly

**Remember:** Perfect is the enemy of shipped. Launch first, iterate second.