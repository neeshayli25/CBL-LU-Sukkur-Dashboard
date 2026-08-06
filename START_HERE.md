# START HERE — Preview / Presentation (cloud database)

**Goal:** Show the HSE dashboard with your real plant Excel data.  
**No local MySQL.** **No Microsoft SSO.** Just preview login.

---

## Step 1 — Get a free cloud MySQL database

Pick any MySQL 8 host (all work the same way):

| Provider | Notes |
|----------|-------|
| [Railway](https://railway.app) | New project → Add MySQL → copy connection vars |
| [Aiven](https://aiven.io) | Free trial MySQL |
| [db4free.net](https://db4free.net) | Free, good for demos |

You need these 5 values:

- **Host** (e.g. `xxx.railway.app`)
- **Port** (usually `3306`)
- **Database name** (create `cbl_db` or use the default they give you)
- **Username**
- **Password**

Most cloud hosts require **SSL** — set `DB_SSL=true`.

---

## Step 2 — Save credentials

Copy the example file and fill in your values:

```powershell
cd "C:\Users\Nisha Ali\CBL-LU-Sukkur-Dashboard"
copy backend\.env.cloud.example backend\.env.cloud
notepad backend\.env.cloud
```

Example:

```env
DB_HOST=your-host.railway.app
DB_PORT=3306
DB_NAME=cbl_db
DB_USER=root
DB_PASSWORD=your_password_here
DB_SSL=true
```

---

## Step 3 — Run the app

```powershell
git pull origin main
powershell -ExecutionPolicy Bypass -File .\start-preview.ps1
```

This will:
1. Connect to your **cloud MySQL** (not local)
2. Create tables + seed superadmin user
3. Import all plant Excel files from `data/imports/`
4. Start backend + frontend

---

## Step 4 — Login

Open **http://localhost:5173**

- Click **Sign in (Local Preview)**
- Email: `superadmin@cblapp.com`
- Password: `Admin@123!`
- Avatar must show **SA**

You should see data in:
- Hazard Reporting, Near Miss, Incident Log
- Action Tracker, Training Records, Critical Audit Plan
- Dashboard KPIs

You can **add new log entries** in each section — they save to the cloud database.

---

## Manual start (if script fails)

```powershell
cd "C:\Users\Nisha Ali\CBL-LU-Sukkur-Dashboard"
npm install

node backend\scripts\setup-cloud-mysql.js

cd backend
npm run dev
```

Second terminal:

```powershell
cd "C:\Users\Nisha Ali\CBL-LU-Sukkur-Dashboard\apps\management-dashboard"
npm run dev
```

Ensure `apps\management-dashboard\.env` has:

```env
VITE_BYPASS_AUTH=true
VITE_PREVIEW_EMAIL=superadmin@cblapp.com
VITE_PREVIEW_PASSWORD=Admin@123!
```

---

## Re-import plant Excel data

If you need to reload all files from scratch:

```powershell
cd backend
node scripts\import-plant-data.js --force
```

Excel files live in `data/imports/` (already in the repo).

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| `Cloud MySQL credentials missing` | Create `backend/.env.cloud` from the example |
| `ECONNREFUSED` / timeout | Check host, port, firewall; allow your IP on cloud DB |
| SSL error | Set `DB_SSL=true` in `.env.cloud` |
| Empty tables / zeros | Run `node backend\scripts\import-plant-data.js --force` |
| Avatar **UP** | Set `VITE_BYPASS_AUTH=true`, restart frontend |
| `401` on API | Use Local Preview login (gets real JWT) |

---

## Plant data files (bundled in repo)

| File | Module |
|------|--------|
| `Hazard_Log_Sheet_YTD-June-2026_ab87.xlsx` | Hazard + Near Miss |
| `Action_Tracker-_June__-_26_-_Copy_5e9c.xlsx` | Action Tracker |
| `Departmental_Training_Log_YTD-June-2026_9bdb.xlsx` | Training Records |
| `DCS_Required_For_PRJ_6262.xlsx` | Critical Audit Plan |
| `Incident_Log_YTD-June-26_6a83.xlsx` | Incident Log |

---

## Microsoft SSO

Skip for now. Come back to it only after preview works.
