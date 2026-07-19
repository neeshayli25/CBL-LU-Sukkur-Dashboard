# CBL LU Sukkur Plant — Management Dashboard (Frontend)

> A branded, role-aware management dashboard for Continental Biscuits Limited's (CBL) LU Power Plant in Sukkur — built to give plant leadership a single, real-time view of HSE performance, safety observations, audits, and CAPA tracking.

![Status](https://img.shields.io/badge/status-active--development-yellow)
![Frontend](https://img.shields.io/badge/frontend-React%20%2B%20Vite-blue)
![Theme](https://img.shields.io/badge/theme-LU%20Brand-maroon)

---

## 🚀 Overview

This is the **frontend monorepo** for the CBL LU Power Plant Management System. It's a React/Vite application built with a modular **Turborepo + npm workspaces** architecture, fully branded in the official **LU theme** (Maroon, Amber, Cream, Caramel) with complete Dark/Light mode support.

The dashboard consolidates what used to be two separate views (employee + management) into a **single, unified management dashboard**, with data automatically scoped per logged-in user's department once real authentication is live.

While the backend (built separately by the team — see [Backend](#-backend) below) is being finalized, the frontend runs against **mock data and `localStorage`** so UI/UX work isn't blocked.

### Tech Stack
| Layer | Technology |
|---|---|
| Framework | React 18 + Vite |
| Styling | Tailwind CSS + custom LU brand CSS variables |
| Icons | `lucide-react` |
| Charts | `recharts` |
| Auth | Microsoft Authentication Library (`@azure/msal-react`) |
| Architecture | Turborepo Monorepo (`apps/management-dashboard`, `packages/auth`, `packages/ui`, etc.) |

---

## 🖥️ Features

### Core Dashboard Pages
KPI cards, charts, and filterable tables (by Year, Department, Status) across:
- Dashboard (main KPI hub)
- Observations · Status Tracker · Analytics
- Audit Plan · Categories · Departments · Priority · Root Cause
- Actions / CAPA · Due Dates · Reports · Settings

### Schema-Driven HSE Data Entry (6 modules)
A single, config-driven component (`DataEntrySection.tsx`) powers six independent logs, each with its own form, editable table, inline delete/save, and CSV export — no per-section rebuilding required:
1. Hazard Reporting
2. Near Miss
3. Incident Log
4. Action Tracker
5. Departmental Training
6. Activity Training

Column definitions and per-section accent colors live in `src/config/sectionSchemas.ts`, driven off real Excel sheet structures. Entries currently persist to `localStorage` (e.g. `cbl_data_hazard-reporting`) until backend CRUD endpoints are wired in.

### Theming
- Full LU brand palette (Maroon / Amber / Cream / Caramel) as CSS variables in `apps/management-dashboard/src/index.css`
- Complete Dark/Light mode via `ThemeProvider` — applied consistently across sidebar, cards, charts, and tables
- Distinct accent colors per HSE module for quick visual identification

### Authentication (Microsoft SSO)
Two-step flow: Microsoft Entra ID popup login → backend verification of the user's email and role (see [API Contract](#-expected-backend-api-contract)).

> **⚠️ Current Bypass Mode:** The backend is still stabilizing CORS/connectivity, so real auth is temporarily bypassed via a flag in `packages/auth/src/hooks/useAuth.ts`:
> ```ts
> const BYPASS_AUTH = true;
> ```
> While `true`, clicking "Sign in with Microsoft" logs in as a mock `Plant Manager (Bypass)` and routes straight to the dashboard. Set to `false` once the backend's `/auth/verify-email` endpoint is confirmed reachable.

---

## 🔌 Backend

The backend is a separate, production-grade service: **Node.js + Express + MySQL (Sequelize)**, with JWT auth, RBAC, Redis/BullMQ, Socket.IO, Swagger docs, audit logging, and dedicated HSE modules (Hazards, Near Misses, Incidents, Training, Audits, Inspections, Corrective Actions) matching this frontend's data entry sections.

Backend repo: *link here once separated / or note if in the same monorepo*

**Expected API contract** the frontend integrates against:

**`POST /auth/verify-email`**
```json
// Request
{ "email": "user@example.com" }

// Success (200)
{
  "success": true,
  "message": "User authorized",
  "data": { "id": 1, "name": "Ali Raza", "email": "ali@example.com", "role": "admin" }
}

// Failure (404)
{ "success": false, "message": "User not authorized" }
```

Full backend API reference (HSE modules, RBAC, roles, notifications, etc.) is documented via Swagger at `http://localhost:5000/api/docs` when running locally.

---

## 🛠️ Setup

1. Clone the repository.
2. Install dependencies from the root:
   ```bash
   npm install
   ```
3. Create `.env` in `apps/management-dashboard/`:
   ```env
   VITE_MSAL_CLIENT_ID=your_client_id
   VITE_MSAL_TENANT_ID=your_tenant_id
   VITE_API_URL=http://localhost:5000/api/v1
   ```
4. Start the dev server:
   ```bash
   npm run dev
   ```
5. Open `http://localhost:5173`.

> To run against the real backend, ensure the API server is running (see backend repo), confirm CORS allows `localhost:5173` as an origin, then set `BYPASS_AUTH = false` in `packages/auth/src/hooks/useAuth.ts`.

---

## 🗺️ Roadmap

- [ ] Resolve backend CORS/connectivity and disable auth bypass
- [ ] Replace `localStorage`-backed HSE data entry with live backend CRUD
- [ ] Wire department-scoped data filtering to the real user role/department returned by `/auth/verify-email`
- [ ] Connect KPI cards, charts, and tables to live SQL data instead of mock data
- [ ] Production deployment

---

## 📁 Project Structure

```
apps/
  management-dashboard/      # Main React/Vite app
packages/
  auth/                      # MSAL + auth hooks (useAuth.ts, BYPASS_AUTH flag)
  ui/                        # Shared UI components
```

---

*Maintained by the CBL LU Sukkur Plant digital team.*
