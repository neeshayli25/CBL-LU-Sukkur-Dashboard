# AGENTS.md

## Cursor Cloud specific instructions

This repo is the **CBL LU Sukkur Plant HSE Management System** — a full-stack app with three
runnable pieces plus shared workspace packages:

- `backend/` — Node.js/Express REST API (port **5000**), MySQL + Sequelize, Redis (optional), Socket.IO.
- `frontend/apps/management-dashboard/` — React 19 + Vite SPA (port **5173**).
- `packages/*` — shared TS packages (`@cbl/api`, `@cbl/auth`, `@cbl/ui`, `@cbl/tsconfig`, `@cbl/eslint-config`) consumed by the frontend.
- MySQL 8 (db `cbl_db`, user `root`, password `secret`) and Redis are started with `service mysql start` / `service redis-server start` (this VM has no systemd). Connect to MySQL over TCP (`-h 127.0.0.1`); the unix socket rejects non-root local connections.

The startup update script already installs deps and (re)creates the symlinks described below, so
you normally don't need to touch them.

### Running the services

- **Backend:** from `backend/`, ensure `.env` exists (already created; key values: `DB_HOST=127.0.0.1`, `DB_PASSWORD=secret`, `DB_NAME=cbl_db`, generated JWT secrets, `ENCRYPTION_KEY` must be exactly 32 chars). Start with `npm run dev` (nodemon). Health check: `curl localhost:5000/api/health`.
  - Nodemon only watches `src/**`. If you edit `server.js` or other root-level files, it will **not** auto-restart — type `rs` in the nodemon terminal (or restart it).
- **Frontend:** run **vite directly** from `frontend/apps/management-dashboard/` with `npm run dev`. Do **not** use `turbo run dev` / `npm run dev` at the `frontend/` root — turbo aborts with "Workspace package resolves outside repository root" because of the `frontend/packages` symlink. Open http://localhost:5173.
  - `frontend/apps/management-dashboard/.env` sets `VITE_API_URL=http://localhost:5000/api/v1` and `VITE_BYPASS_AUTH=true`. Bypass mode renders the full dashboard UI with a fake preview identity but sends **no** JWT, so backend calls return 401 (expected).

### Database migrations / seeders (important gotchas)

- `.sequelizerc` points `config` at a non-existent `src/config/database.js`, and `npm run migrate` / `npm run seed` are broken (wrong logger path / missing `scripts/seed.js`). Use the Sequelize CLI with an explicit config instead:
  - `npx sequelize-cli db:migrate --config src/database/config/database.js`
  - `npx sequelize-cli db:seed:all --config src/database/config/database.js`
- Seeders are **not idempotent** — re-running `db:seed:all` after a successful seed fails with a duplicate-key "Validation error" on roles. That's harmless if the data is already seeded (superadmin `superadmin@cblapp.com` / `Admin@123!`, 4 roles, 77 permissions, 2 plants, 3 departments).

### Shared-package wiring (why the symlinks exist)

The frontend expects the `@cbl/*` packages under `frontend/packages/*`, but they actually live at
repo-root `packages/*`, and the monorepo has no committed workspace-root install for them. The
startup update script wires this up with three symlinks (recreate them if the frontend fails to
resolve `@cbl/*`, `clsx`, `@azure/msal-*`, etc.):

- `frontend/packages -> ../packages` (satisfies the vite aliases and a relative `../../../../packages/...` import).
- `node_modules/react` and `node_modules/react-dom -> ../frontend/node_modules/react*` (so package sources use the **same** React instance as the app — avoids invalid-hook errors).
- `node_modules/@cbl/*` is created automatically by the root `npm install` (root `package.json` declares `packages/*` as workspaces).

### Lint / test

- Backend lint: `npm run lint` (ESLint) in `backend/`. Backend tests: `npm test` (Jest) — note the test files under `backend/tests/` reference stale pre-refactor paths and will need path fixes before they run.
- Frontend lint: `npm run lint` (oxlint) in `frontend/apps/management-dashboard/`.

### Known pre-existing issues (NOT environment problems)

This repo is mid-refactor; a few application-level things are incomplete (fixing them is app work, not env setup):

- Backend **login / authenticated CRUD is broken**: the core Sequelize models (`src/modules/users/user.model.js`, `role.model.js`, …) are minimal stubs that don't match the migrations (missing `password`, `withPassword` scope, `first_name`, UUID id, etc.). `POST /api/v1/auth/login` returns `Invalid scope withPassword called`, and all authed endpoints therefore 401/500.
- Swagger UI at `/api/docs` shows "No operations defined" because `src/database/config/swagger.js` scans a stale path (`./src/api/v1/routes/*.js`).
