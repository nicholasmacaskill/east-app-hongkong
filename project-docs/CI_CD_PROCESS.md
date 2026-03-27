# 🚀 EAST App: Push & Test Guide

Follow these 3 simple steps to move changes from your computer to the live site.

---

### Step 1: Work on a New Branch
Always create a new branch for each task so you don't break the main code.
```bash
git checkout -b your-feature-name
# Make your changes, then save them:
git commit -am "My changes"
git push origin your-feature-name
```

### Step 2: Test on STAGING (Test Branch)
Before making changes live, push them to the **Test Branch** for stakeholder review.
```bash
git checkout test
git merge your-feature-name
git push origin test
```
🔗 **Test Link**: [https://test-branch-east.vercel.app](https://test-branch-east.vercel.app)
*(This uses **Stripe Test Mode**—it's safe to buy things with test cards here.)*

### Step 3: Go LIVE (Main Branch)
Once stakeholders approve, push the changes to the **Main Branch** to go live.
```bash
git checkout main
git merge test
git push origin main
```
🔗 **Live Link**: [https://app.eastsportsgroup.com/](https://app.eastsportsgroup.com/)
*(This uses **Stripe Live Mode**—everything here is real!)*
