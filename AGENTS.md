# AGENTS.md

## Cursor Cloud specific instructions

This repo is the **CBL LU Sukkur Plant HSE Management System** — a full-stack app with three
runnable pieces plus shared workspace packages:

- `backend/` — Node.js/Express REST API (port **5000**), MySQL + Sequelize, Redis (optional), Socket.IO.
- `apps/management-dashboard/` — React 19 + Vite SPA (port 5173).
- `packages/*` — shared TS packages (`@cbl/api`, `@cbl/auth`, `@cbl/ui`, `@cbl/tsconfig`, `@cbl/eslint-config`) consumed by the frontend.
- MySQL 8 (db `cbl_db`, user `root`, password `secret`) and Redis are started with `service mysql start` / `service redis-server start` when available (this VM may have no systemd — start `mysqld`/`redis-server` directly). Connect to MySQL over TCP (`-h 127.0.0.1`); the unix socket rejects non-root local connections.

### Running the services

- **Backend:** from `backend/`, ensure `.env` exists (key values: `DB_HOST=127.0.0.1`, `DB_PASSWORD=secret`, `DB_NAME=cbl_db`, generated JWT secrets, `ENCRYPTION_KEY` must be exactly 32 chars). Start with `npm run dev` (nodemon). Health check: `curl localhost:5000/api/health`.
  - Nodemon only watches `src/**`. If you edit `server.js` or other root-level files, it will **not** auto-restart — type `rs` in the nodemon terminal (or restart it).
- **Frontend:** run `npm run dev` at the repository root. This uses Turborepo to start the Vite dev server for `apps/management-dashboard`. Open http://localhost:5173.
  - **Must bind `--host 0.0.0.0`**: plain `vite` / `npm run dev` binds only to IPv6 `::1`, which causes `ERR_CONNECTION_RESET` / connection refused from the Cursor browser pane and from `127.0.0.1`. Confirm with `ss -tlnp | grep 5173` — you want `0.0.0.0:5173`, not `::1:5173`.
  - For **live API integration** set `VITE_BYPASS_AUTH=false` and point `VITE_API_URL=http://localhost:5000/api/v1`. Bypass mode (`true`) is UI preview only (no JWT).

### Database migrations / seeders

Canonical commands from `backend/` (`.sequelizerc` is fixed):

```bash
npm run migrate
npm run seed
```

Seeded superadmin: `superadmin@cblapp.com` / `Admin@123!`  
Seeders skip existing rows where possible; role-permissions seeder re-syncs join table.

### Shared-package wiring (Turborepo Structure)

The monorepo uses npm workspaces defined in the root `package.json` (`apps/*` and `packages/*`).
A standard `npm install` from the root directory handles all dependencies and symlinks `@cbl/*` packages automatically.
Do NOT create manual symlinks for `@cbl/*` or `react`. The Turborepo structure natively resolves this.

### Lint / test

- Backend lint: `npm run lint` (ESLint) in `backend/`.
- Backend auth smoke: `npm run test:integration -- --testPathPattern=auth.smoke` (needs migrated+seeded DB).
- Frontend lint: `npm run lint` (oxlint) in `apps/management-dashboard/` or run `npm run lint` from the root.

### Remaining application gaps

- `ra_*` reporting control-plane endpoints return **501** until enterprise SQL under `database/schema/` is applied (performance report works).
- Many legacy Jest tests under `backend/tests/` still reference pre-refactor paths.
- Microsoft Entra tenant provisioning is an IT/config task, not code.
