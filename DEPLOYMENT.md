# Deployment Setup

## Overview

This repository has two deployment environments:

### Live Environment (Production)
- **Branch**: `main`
- **URL**: [https://app.eastsportsgroup.com/](https://app.eastsportsgroup.com/) (or your configured production domain)
- **Mode**: Live Stripe mode
- **Deployments**: Auto-deploy on push to `main` branch.

### Test Environment (Staging)
- **Branch**: `test`
- **URL**: Accessible via Vercel Preview URLs or a custom domain (e.g., `test.eastsportsgroup.com`).
- **Mode**: Test Stripe mode
- **Deployments**: Auto-deploy on push to `test` branch.

## Setup Instructions

### 1. Initial Server Setup

Run the setup script on the Singapore VPS:

```bash
cd /path/to/your/local/repo
./scripts/setup-environments.sh
```

This will:
- Create directories for both environments
- Set up nginx configuration
- Configure PM2 processes
- Clone repositories

### 2. Create Test Branch

```bash
./scripts/setup-test-branch.sh
```

This will create a `test` branch that mirrors `main` but uses test credentials.

## Workflow

### To Deploy Changes to Live:
1. Make changes to `main` branch
2. Push to `main`: `git push origin main`
3. Auto-deployment will trigger to live environment

### To Deploy Changes to Test:
1. Make changes to `main` branch
2. Switch to test branch: `git checkout test`
3. Merge main into test: `git merge main`
4. Push to test: `git push origin test`
5. Auto-deployment will trigger to test environment

### To Keep Test Branch in Sync:

```bash
git checkout test
git merge main
git push origin test
```

## Environment Variables

The deployment uses different environment variables:

### Live Mode (`main` branch):
- `NEXT_PUBLIC_STRIPE_MODE=live`
- Live Stripe keys
- Live database credentials

### Test Mode (`test` branch):
- `NEXT_PUBLIC_STRIPE_MODE=test`
- Test Stripe keys
- Test database credentials

## PM2 Processes

Two separate PM2 processes run:

- `EastApp`: Live environment on port 3000
- `EastAppTest`: Test environment on port 3001

## Local Development

### Test Mode:
```bash
npm run dev:test
```

### Live Mode:
```bash
npm run dev:live
```

### Regular Development:
```bash
npm run dev
```
