# START HERE — localhost (Windows)

**Goal:** Run backend + frontend + database on **localhost** with your plant Excel data loaded.  
**No cloud DB. No Microsoft SSO.** Local Preview login only.

---

## One command (recommended)

```powershell
cd "C:\Users\Nisha Ali\CBL-LU-Sukkur-Dashboard"
git pull origin main
powershell -ExecutionPolicy Bypass -File .\start-local.ps1
```

This script will:
1. **Try Docker MySQL first** (port **3307**) — most reliable, no Windows MySQL fights
2. Fall back to **Windows MySQL service** (port **3306**) if Docker is not available
3. Test DB connection before migrate
4. Migrate + seed superadmin user
5. Import all plant Excel files from `data/imports/` (~5,000 rows)
6. Start backend (:5000) and frontend (:5173)

---

## Login

Open **http://localhost:5173**

- Click **Sign in (Local Preview)**
- Email: `superadmin@cblapp.com`
- Password: `Admin@123!`
- Avatar must show **SA** (not UP)

---

## Database options

| Method | Port | When to use |
|--------|------|-------------|
| **Docker MySQL** (recommended) | 3307 | Docker Desktop installed — `start-local.ps1` picks this automatically |
| **Windows MySQL service** | 3306 | No Docker; service `MySQL80_New` running, password `secret` |

Credentials (both methods):
- Host: `127.0.0.1` (always use this, not `localhost`)
- User: `root`
- Password: `secret`
- Database: `cbl_db`

---

## Manual setup (if script fails)

### Option A — Docker MySQL (easiest)

```powershell
docker compose -f docker-compose.db.yml up -d
npm install
node backend\scripts\setup-local-mysql.js --port 3307
```

### Option B — Windows MySQL service

```powershell
Start-Service MySQL80_New
npm install
node backend\scripts\setup-local-mysql.js --port 3306
```

Then two terminals:

```powershell
# Terminal 1
cd backend
npm run dev

# Terminal 2
cd apps\management-dashboard
npm run dev
```

---

## Test database connectivity

```powershell
cd backend
node scripts\test-db-connection.js
node scripts\test-db-connection.js --port 3307
```

---

## Re-import plant Excel data

```powershell
cd backend
node scripts\import-plant-data.js --force
```

Files are in `data/imports/` (bundled in the repo).

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| `Access denied for user 'root'` | Wrong password — run setup with `--password YOURPASS` or reset MySQL to `secret` |
| `ECONNREFUSED 127.0.0.1:3306` | MySQL not running — use Docker or `Start-Service MySQL80_New` |
| `ECONNREFUSED 127.0.0.1:3307` | Run `docker compose -f docker-compose.db.yml up -d` |
| Backend crash loop | Run `node backend\scripts\test-db-connection.js` first |
| Blank frontend / missing vite | Run `npm install` from repo root |
| Zeros on dashboard | Run `node backend\scripts\import-plant-data.js --force` |
| Avatar **UP** / 401 errors | Set `VITE_BYPASS_AUTH=true` in `apps\management-dashboard\.env`, restart frontend |
| `Please install sqlite3` | Do **not** use sqlite on Windows — use MySQL path above |

---

## Health checks

```powershell
curl http://localhost:5000/api/health
```

Expected: `"Server is healthy"`

---

## Plant data loaded

| Module | ~Records |
|--------|----------|
| Hazard Reporting | 1,795 |
| Near Miss | 123 |
| Action Tracker | 1,982 |
| Training Records | 1,049 |
| Critical Audit Plan | 40 |
| Incident Log | 18 |

You can add new entries in any section — they save to localhost MySQL.

---

## Microsoft SSO

Skip for now. Use Local Preview until everything else works.
