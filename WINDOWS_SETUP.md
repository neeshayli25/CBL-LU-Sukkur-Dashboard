# Local setup (Windows / macOS / Linux)

**You do not need MySQL Workbench, Docker, or a MySQL Windows service.**

The recommended path stores the database **inside the project** at:

`backend/data/cbl.sqlite`

---

## One-time setup

From the repo root in PowerShell or terminal:

```powershell
cd C:\Users\Nisha Ali\CBL-LU-Sukkur-Dashboard
node backend\scripts\setup-embedded.js
```

Or:

```powershell
powershell -ExecutionPolicy Bypass -File .\backend\scripts\setup-embedded.ps1
```

This will:

1. Write `backend/.env` with `DB_DIALECT=sqlite`
2. Write frontend preview `.env` (real JWT login)
3. Create `backend/data/cbl.sqlite`
4. Seed superadmin + demo HSE log-sheet rows

Login: `superadmin@cblapp.com` / `Admin@123!`

---

## Run the app (every day)

Terminal 1:

```powershell
cd backend
npm run dev
```

Terminal 2:

```powershell
cd apps\management-dashboard
npm run dev -- --host 0.0.0.0
```

Open http://localhost:5173 → **Sign in (Local Preview)**

You should see avatar initials **SA** (Super Admin), not **UP**.  
If you see **UP** and zeros, you are on old code or not signed in — pull latest `main` and restart both servers.

Health check:

```powershell
curl http://localhost:5000/api/health
```

---

## “Too many requests. Please slow down.”

Restart the backend (`Ctrl+C` then `npm run dev`).  
On current code, rate limits are skipped when `NODE_ENV=development`.

---

## Optional: import your plant Excel files

Put Excel files under a folder and point the import scripts, or copy them to the paths expected by:

```powershell
cd backend
node scripts\import-log-sheets.js
node scripts\import-incident-log.js
```

Demo rows are already seeded so the dashboard is non-empty after setup.

---

## Optional: MySQL / Docker (not required)

Only if you explicitly want MySQL:

- Docker: `backend\scripts\setup-windows.ps1` (needs virtualization)
- Local MySQL80 service: set `DB_DIALECT=mysql`, `DB_PASSWORD=secret`, then `npm run migrate && npm run seed`

For day-to-day work on Windows without BIOS virtualization, **stay on embedded SQLite**.
