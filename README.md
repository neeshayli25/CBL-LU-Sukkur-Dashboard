# CBL LU Sukkur Plant — Management Dashboard (Frontend)

> A branded, role-aware management dashboard for Continental Biscuits Limited's (CBL) LU Power Plant in Sukkur — built to give plant leadership a single, real-time view of HSE performance, safety observations, audits, and CAPA tracking.

![Status](https://img.shields.io/badge/status-active--development-yellow)
![Frontend](https://img.shields.io/badge/frontend-React%20%2B%20Vite-blue)
![Theme](https://img.shields.io/badge/theme-LU%20Brand-maroon)

---

## 🚀 Overview

This is the **frontend monorepo** for the CBL LU Power Plant Management System. It's a React/Vite application built with a modular **Turborepo + npm workspaces** architecture, fully branded in the official **LU theme** (Maroon, Amber, Cream, Caramel) with complete Dark/Light mode support.

The dashboard consolidates what used to be two separate views (employee + management) into a **single, unified management dashboard**, with data automatically scoped per logged-in user's department once real authentication is live.

While the backend (built separately by the team) is being finalized, the frontend runs against **mock data and `localStorage`** so UI/UX work isn't blocked.

---

## 🏗️ What We Are Building

The goal is to deliver a comprehensive, end-to-end HSE (Health, Safety, and Environment) Management System for the LU Sukkur Plant. This involves digitizing manual records, providing real-time data visualizations, tracking incident closures, managing audits/inspections, and enforcing accountability through an automated Action Tracker (CAPA).

---

## ✅ What Has Been Built (Accomplished)

The frontend foundation is complete, highly modular, and aesthetically polished. The following features and phases have been successfully implemented:

### Phase 1 & Phase 2 Modules
A single, config-driven component (`DataEntrySection.tsx`) powers **seven independent modules**, each with its own form, editable table, inline delete/save, and CSV export. 
1. ⚠️ **Hazard Reporting**
2. 🎯 **Near Miss**
3. 📋 **Incident Log**
4. ✅ **Action Tracker (CAPA)**
5. 📚 **Training Records** (Departmental & Activity)
6. 📝 **Audit Management** *(Phase 2)*
7. 🔍 **Inspection Records** *(Phase 2)*

### Dynamic Dashboard & KPI Visualizations
- **Main KPI Hub:** Real-time metrics counting total hazards, incidents, training manhours, audits, and inspections.
- **Leading & Lagging Indicators:** Detailed modals displaying metric breakdowns (e.g., Fatalities, LTI, LTIR, TRIR, Hazard Spotting) equipped with deep-links clicking through directly to their respective reporting modules.
- **Charts:** Donut charts for Hazard Risk Ratings and Incident Categories, featuring customized, grid-aligned legends perfectly matching design mockups.
- **Filtering:** Global filters across the dashboard and tables allowing users to slice data by Year, Department, and custom Date Ranges.

### UI/UX & Theming
- **LU Brand Palette:** Full integration of Maroon, Amber, Cream, and Caramel as CSS variables (`src/index.css`).
- **Dark/Light Mode:** Complete theme toggle support applied consistently across the sidebar, cards, charts, and tables.
- **Responsive Layout:** Sidebar navigation with custom module accent colors and mobile-friendly collapsible menus.

### Authentication (Microsoft SSO - UI Ready)
- Two-step flow via Microsoft Entra ID popup login is integrated using `@azure/msal-react`.
- *Note:* Currently utilizing a **Bypass Mode** (`BYPASS_AUTH = true`) to allow seamless UI testing while the backend finalizes connectivity.

---

## ⏳ What Is Remaining (Roadmap)

The UI is robust and ready. The remaining tasks revolve around integrating with the live backend database and removing mock/localStorage dependencies:

- [ ] **Disable Auth Bypass:** Resolve backend CORS/connectivity issues and wire up the real `/auth/verify-email` endpoint to validate roles and department scopes.
- [ ] **Live Backend CRUD:** Replace all `localStorage`-backed data entry modules (Hazards, Incidents, Audits, etc.) with real REST/GraphQL API calls.
- [ ] **Live Dashboard Data:** Connect KPI cards, charts, and tables to live SQL data feeds instead of local mock data.
- [ ] **RBAC Implementation:** Ensure frontend views strictly adhere to the role-based access control (RBAC) permissions provided by the backend JWT.
- [ ] **Production Deployment:** Bundle and deploy the application via CI/CD pipelines to the production server.

---

## 💻 Tech Stack

| Layer | Technology |
|---|---|
| Framework | React 18 + Vite |
| Styling | Tailwind CSS + custom LU brand CSS variables |
| Icons | `lucide-react` |
| Charts | `recharts` |
| Auth | Microsoft Authentication Library (`@azure/msal-react`) |
| Architecture | Turborepo Monorepo (`apps/management-dashboard`, `packages/auth`, `packages/ui`) |

---

## 🔌 Expected Backend API Contract

The backend is a separate service: **Node.js + Express + MySQL (Sequelize)**, featuring JWT auth, RBAC, Redis, and Swagger docs. 

**Authentication API contract** the frontend expects:

**`POST /auth/verify-email`**
```json
// Request
{ "email": "user@example.com" }

// Success (200)
{
  "success": true,
  "message": "User authorized",
  "data": { "id": 1, "name": "Ali Raza", "email": "ali@example.com", "role": "admin", "department_id": "Production" }
}

// Failure (404)
{ "success": false, "message": "User not authorized" }
```

---

## 🛠️ Setup Instructions

1. Clone the repository.
2. Install dependencies from the root:
   ```bash
   npm install
   ```
3. Create a `.env` file in `apps/management-dashboard/`:
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

> **Note:** To run against the real backend, ensure the API server is running, confirm CORS allows `localhost:5173`, and set `BYPASS_AUTH = false` in `packages/auth/src/hooks/useAuth.ts`.

---

## 📁 Project Structure

```text
apps/
  management-dashboard/      # Main React/Vite application
packages/
  auth/                      # MSAL setup + authentication hooks
  ui/                        # Shared UI components across the monorepo
  eslint-config/             # Shared linting rules
```

---

*Maintained by the CBL LU Sukkur Plant digital team.*
