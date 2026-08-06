# CBL LU Sukkur Plant — HSE Management System

Full-stack Health, Safety, and Environment (HSE) management system for Continental Biscuits Limited's LU Sukkur plant.

| Piece | Path | Port |
|---|---|---|
| Backend API (Express + Sequelize + MySQL) | `backend/` | **5000** |
| Management Dashboard (React 19 + Vite) | `apps/management-dashboard/` | **5173** |
| Shared packages | `packages/*` (`@cbl/api`, `@cbl/auth`, `@cbl/ui`, …) | — |
| Enterprise SQL reference (not the primary local path) | `database/schema/` | — |

> **Primary runnable path:** Sequelize migrations against MySQL database `cbl_db` via `backend/`.  
> The SQL under `database/schema/` is kept as enterprise reference and is **not** required for local/IT bootstrap.

---

## Quick Start (Windows)

If MySQL says `Access denied for user 'root'@'localhost'`, use Docker MySQL:

```powershell
powershell -ExecutionPolicy Bypass -File .\backend\scripts\setup-windows.ps1
```

Details: [`WINDOWS_SETUP.md`](./WINDOWS_SETUP.md)

---

## Quick Start (verified)

### Prerequisites

| Requirement | Version | Notes |
|---|---|---|
| Node.js | ≥ 18 | `node -v` |
| npm | ≥ 9 | `npm -v` |
| MySQL | 8.x | TCP on `127.0.0.1:3306` |
| Redis | 7.x (optional) | App starts if Redis is down |

### 1) Install dependencies

```bash
# Root (frontend workspaces + Turborepo)
npm install

# Backend
cd backend && npm install && cd ..
```

### 2) Configure backend environment

```bash
cd backend
cp .env.example .env
# Edit .env — at minimum set:
#   DB_HOST=127.0.0.1
#   DB_PASSWORD=<your mysql password>
#   JWT_* secrets (npm run generate:key)
#   ENCRYPTION_KEY  (exactly 32 characters)
#   MAIL_*          (placeholders OK for local)
```

Generate secrets:

```bash
cd backend && npm run generate:key
```

Create the database:

```sql
CREATE DATABASE IF NOT EXISTS cbl_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

> On Linux, prefer `DB_HOST=127.0.0.1` over `localhost` so Node uses TCP (unix socket may reject non-root connections).

### 3) Migrate + seed (canonical commands)

From `backend/`:

```bash
npm run migrate    # sequelize-cli → all 16 migrations
npm run seed       # roles, permissions, role_permissions, superadmin, plants, departments
```

Seeders are **mostly re-run safe** (skip if data already exists). The role-permissions seeder re-syncs join rows.

Default admin after seed:

| Field | Value |
|---|---|
| Email | `superadmin@cblapp.com` |
| Password | `Admin@123!` |

> Change this password immediately in any shared or production environment.

### 4) Start backend

```bash
cd backend
npm run dev
```

Checks:

```bash
curl http://localhost:5000/api/health
# Swagger UI:  http://localhost:5000/api/docs
# OpenAPI JSON: http://localhost:5000/api/docs.json
```

### 5) Start frontend

```bash
# From repo root
cp apps/management-dashboard/.env.example apps/management-dashboard/.env
# Set VITE_API_URL=http://localhost:5000/api/v1
# Set VITE_BYPASS_AUTH=false for real API auth
# Add VITE_MSAL_CLIENT_ID / VITE_MSAL_TENANT_ID for Microsoft SSO

npm run dev
```

Open `http://localhost:5173`.

> Vite must bind `0.0.0.0` (already set in `apps/management-dashboard` via `vite --host 0.0.0.0`).

**Preview login:** `VITE_BYPASS_AUTH=true` signs in as seeded superadmin with a **real JWT** against the local API. Use this until Microsoft SSO is configured (`VITE_BYPASS_AUTH=false` + Entra IDs + user in DB). See `START_HERE.md`.

---

## Auth contracts

### Email/password login

`POST /api/v1/auth/login`

```json
{ "email": "superadmin@cblapp.com", "password": "Admin@123!" }
```

Returns `{ success, data: { user, tokens: { accessToken, refreshToken } } }` where `user` is normalized:

```json
{
  "id": "...",
  "name": "Super Admin",
  "email": "superadmin@cblapp.com",
  "roles": ["super_admin"],
  "permissions": ["hse:view_dashboard", "..."],
  "department_id": null,
  "plant_id": null
}
```

Also available:

| Method | Route | Notes |
|---|---|---|
| `POST` | `/auth/refresh-token` | Body `{ refreshToken }` |
| `POST` | `/auth/logout` | Bearer access token |
| `GET` | `/auth/me` | Bearer access token → normalized user |

### Microsoft SSO verify-email (frontend live mode)

Frontend (`packages/api` → `authClient.verifyEmail`) calls:

`POST /api/v1/auth/verify-email` with `{ email }`

Success:

```json
{
  "success": true,
  "message": "User authorized",
  "data": {
    "authorized": true,
    "email": "user@example.com",
    "user": {
      "id": "...",
      "name": "...",
      "email": "...",
      "roles": ["..."],
      "permissions": ["..."],
      "department_id": null,
      "plant_id": null
    },
    "tokens": {
      "accessToken": "...",
      "refreshToken": "..."
    }
  }
}
```

Failure (unknown / inactive user): **404** `{ success: false, message: "User not authorized", data: { authorized: false } }`

`GET /auth/verify-email?token=` remains for registration email-link verification and does not conflict with the POST SSO route.

---

## HSE module routes (JWT required)

| UI Module | API |
|---|---|
| Hazard Reporting | `GET/POST /api/v1/hazards` |
| Near Miss | `/api/v1/near-misses` |
| Incident Log | `/api/v1/incidents` |
| Action Tracker (CAPA) | `/api/v1/corrective-actions` |
| Training | `/api/v1/trainings` |
| Audits | `/api/v1/audits` |
| Inspections | `/api/v1/inspections` |
| Plants / Departments / Users / Roles | `/plants`, `/departments`, `/users`, `/roles` |

List endpoints return **200** with an array (possibly empty) once authenticated as seeded superadmin.

Performance report (working):

```bash
GET /api/v1/reports/performance?startDate=2026-01-01&endDate=2026-12-31
```

---

## Backend scripts

From `backend/`:

| Command | Description |
|---|---|
| `npm run dev` | Nodemon (watches `src/**`) |
| `npm start` | Production node |
| `npm run migrate` | `sequelize-cli db:migrate` (uses fixed `.sequelizerc`) |
| `npm run seed` | `sequelize-cli db:seed:all` |
| `npm run db:fresh` | Undo all → migrate → seed |
| `npm run generate:key` | Print JWT + encryption secrets |
| `npm test` | Jest (many legacy tests still point at pre-refactor paths) |
| `npm run test:integration -- --testPathPattern=auth.smoke` | Auth smoke test |

---

## Docker Compose

`docker-compose.yml` provides **mysql + redis + backend + frontend** using the Turborepo layout (`apps/management-dashboard`), not a stale `./frontend` folder.

```bash
docker compose up --build
# then inside backend container / or host:
#   npm run migrate && npm run seed
```

The **supported and verified** local path remains the npm commands above. Treat Compose as a convenience; validate migrate/seed after first boot.

---

## IT Deployment checklist

1. **Prerequisites:** Node ≥ 18, MySQL 8, process manager (PM2/systemd), optional Redis.
2. **Clone & install:** `npm install` at repo root; `cd backend && npm install`.
3. **Environment:** Copy `backend/.env.example` → `.env`. Set strong `JWT_*`, `ENCRYPTION_KEY` (32 chars), real `DB_*`, `ALLOWED_ORIGINS` (production frontend origin), SMTP.
4. **Database once:**
   ```bash
   mysql -h 127.0.0.1 -u root -p -e "CREATE DATABASE IF NOT EXISTS cbl_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
   cd backend && npm run migrate && npm run seed
   ```
5. **API process:** `pm2 start server.js --name cbl-api` (from `backend/`) or equivalent. Health: `/api/health`.
6. **Frontend build:** From repo root, set `apps/management-dashboard/.env` with:
   - `VITE_API_URL=https://<api-host>/api/v1`
   - `VITE_BYPASS_AUTH=false`
   - Real `VITE_MSAL_CLIENT_ID` / `VITE_MSAL_TENANT_ID`
   - Then `npm run build` (Turborepo) and serve `apps/management-dashboard/dist`.
7. **Hardening:** Change `superadmin@cblapp.com` password; disable preview bypass; restrict CORS; do not commit `.env`.

---

## Frontend notes

- Monorepo: Turborepo + npm workspaces (`apps/*`, `packages/*`). There is **no** top-level `frontend/` directory.
- API clients live in `packages/api/src/` (`authClient`, `client`, dashboard/report/upload helpers).
- Auth store/hooks live in `packages/auth`.
- LU branding (maroon / amber / cream / caramel) and module UI are intact.

---

## Remaining / known gaps

| Item | Status |
|---|---|
| Sequelize auth + core HSE CRUD list/create path | **Fixed** — verified locally |
| `POST /auth/verify-email` SSO contract | **Fixed** — normalized user + tokens |
| Migrate/seed via `npm run migrate` / `npm run seed` | **Fixed** |
| Swagger at `/api/docs` | **Fixed** — Auth operations annotated; more JSDoc can be added per module |
| `ra_*` reporting control-plane tables (`/reports/widgets`, `/saved`, …) | **501 TODO** — tables live in `database/schema/`, not Sequelize migrations. Performance report works. |
| Full Microsoft Entra tenant provisioning | Out of scope — configure MSAL env vars in IT |
| Legacy Jest tests under `backend/tests/` | Many still reference pre-refactor paths; use `auth.smoke` integration test |
| Enterprise SQL (`database/schema/`) full import into Sequelize | Out of scope — kept as reference |

---

## Smoke test commands (copy/paste)

```bash
# Health
curl -s http://localhost:5000/api/health

# Login
curl -s -X POST http://localhost:5000/api/v1/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"superadmin@cblapp.com","password":"Admin@123!"}'

# Use accessToken from login:
export TOKEN='<accessToken>'

curl -s http://localhost:5000/api/v1/auth/me -H "Authorization: Bearer $TOKEN"
curl -s -X POST http://localhost:5000/api/v1/auth/verify-email \
  -H 'Content-Type: application/json' \
  -d '{"email":"superadmin@cblapp.com"}'
curl -s http://localhost:5000/api/v1/hazards -H "Authorization: Bearer $TOKEN"
curl -s http://localhost:5000/api/docs.json   # should list OpenAPI paths
```

---

*Last verified: 2026-08-04 — migrate, seed, login, me, verify-email, module lists, swagger ops.*
