# Production Issue History

This document tracks significant production issues, their root causes, and resolutions for East App HK.

---

## 2026-03-11: 502 Bad Gateway & Server Action Failures

**Description**:
The application returned a 502 Bad Gateway error on the Ubuntu server. PM2 logs showed "Failed to find Server Action 'x'". This occurred after an SSL renewal and server restart.

**Root Cause**:
1.  **Next.js 16 Migration**: The project was using Next.js 16, which deprecated `middleware.ts` in favor of `proxy.ts`. The server restart triggered a fresh build/start cycle that failed due to this breaking change in the request interception layer.
2.  **Sentry Tunnel Conflict**: Sentry's `tunnelRoute: "/monitoring"` was conflicting with Next.js 16's Server Action ID matching. This caused a mismatch between the Action IDs the client was calling and what the server expected.
3.  **Process Inactivity**: The PM2 process `EastApp` was not running, causing Nginx to return a 502 Gateway error as it had no backend to communicate with.

**Resolution**:
1.  **Code Migration**: Renamed `middleware.ts` to `proxy.ts` and updated the exported function name to `proxy` to comply with Next.js 16 standards.
2.  **Config Update**: Disabled the Sentry `tunnelRoute` in `next.config.js`.
3.  **Clean Build**: Executed a manual purge of `.next` and `node_modules` on the Ubuntu server to ensure no corrupted build state remained.
4.  **Process Restoration**: Manually started the app via PM2 (`pm2 start npm --name "EastApp" -- start`) and saved the process list (`pm2 save`) for persistence.

**Prevention & Mitigation**:
- **Automated Clean Builds**: Updated `.github/workflows/deploy.yml` to automatically run `sudo rm -rf .next` before every build. This prevents Server Action ID drift between deployments.
- **Robust PM2 Management**: Updated the deployment script to handle cases where the app process is missing and to always refresh environment variables (`--update-env`).
- **Persistence**: Configured `pm2 save` in the CI/CD pipeline to ensure the app survives server reboots.
- **Dependency Awareness**: Added this log to ensure future major Next.js version jumps are audited for breaking changes like the `proxy.ts` migration.
