# START HERE — make the app runnable (Windows)

Only use branch **`main`**. Do not open MySQL Workbench.

---

## What was going wrong (summary)

| Symptom | Real cause |
|---------|------------|
| Dashboard all zeros + avatar **UP** | UI “logged in” with **no JWT** → API 401 |
| MySQL Access Denied / Workbench | Local MySQL password / PATH — **not needed anymore** |
| Blank white page after Microsoft SSO | MSAL not initialized (fixed on `main`) |
| Many `cursor/*` branches | Agent leftovers — **deleted**; only `main` remains |
| Microsoft “User not authorized” | Your Entra email not in the `users` table yet |

---

## Path A — Run the app now (recommended)

Uses project database: `backend/data/cbl.sqlite`  
Login: **Local Preview** (real JWT, works offline from Microsoft).

### 1) Pull latest

```powershell
cd "C:\Users\Nisha Ali\CBL-LU-Sukkur-Dashboard"
git checkout main
git pull origin main
git fetch --prune
```

### 2) One-time setup + start

```powershell
powershell -ExecutionPolicy Bypass -File .\start-local.ps1
```

Or manually:

```powershell
node backend\scripts\setup-embedded.js

# Terminal 1
cd backend
npm run dev

# Terminal 2
cd apps\management-dashboard
npm run dev
```

### 3) Open and sign in

1. Browser: **http://localhost:5173** (not `127.0.0.1`)
2. Click **Sign in (Local Preview)**
3. Expect avatar **SA**, non-zero KPIs

Credentials:

- Email: `superadmin@cblapp.com`
- Password: `Admin@123!`

### 4) Confirm it’s healthy

```powershell
curl http://localhost:5000/api/health
```

DevTools → Network → any `/api/v1/log-sheets/...` request must show:

`Authorization: Bearer ...`

---

## Path B — Microsoft SSO (after Path A works)

Your Entra app (already created):

| Field | Value |
|-------|--------|
| Application (client) ID | `6ac94d07-9ab4-470f-924d-6361d471fb0e` |
| Directory (tenant) ID | `90dccc47-53bf-449c-876c-c5649f21f94d` |
| SPA redirect | `http://localhost:5173` only (no `127.0.0.1`) |

### B1) Put IDs in frontend env

```powershell
cd "C:\Users\Nisha Ali\CBL-LU-Sukkur-Dashboard\apps\management-dashboard"

@"
VITE_API_URL=/api/v1
VITE_BYPASS_AUTH=false
VITE_MSAL_CLIENT_ID=6ac94d07-9ab4-470f-924d-6361d471fb0e
VITE_MSAL_TENANT_ID=90dccc47-53bf-449c-876c-c5649f21f94d
"@ | Set-Content -Path .\.env -Encoding UTF8
```

Restart the frontend after changing `.env`.

### B2) Add your Microsoft email to the DB

In Azure → **Users** → your account → copy **User principal name**.

```powershell
cd "C:\Users\Nisha Ali\CBL-LU-Sukkur-Dashboard\backend"
node scripts\add-sso-user.js "YOUR_MICROSOFT_EMAIL_HERE" "Nisha" "Ali" super_admin
```

### B3) Sign in

Open http://localhost:5173 → **Sign in with Microsoft SSO**.

If SSO fails, set `VITE_BYPASS_AUTH=true` again and use Local Preview (Path A).

Full Entra details: `MICROSOFT_AUTH_SETUP.md`

---

## Day-to-day checklist

1. Backend running on **5000**
2. Frontend running on **5173**
3. Open **localhost** (not 127.0.0.1) for Microsoft redirects
4. Avatar **SA** (or your initials) — never **UP**
5. Forms save → Network shows 200/201, not 401
6. Database file stays at `backend/data/cbl.sqlite` — ignore Workbench

Optional Excel import:

```powershell
cd backend
node scripts\import-log-sheets.js
node scripts\import-incident-log.js
```

---

## If something breaks

| Message | Fix |
|---------|-----|
| Authentication token is required | Sign in again (Local Preview). Restart frontend after `git pull`. |
| Blank white page | `git pull` (MSAL fix). Hard refresh. Use localhost:5173. |
| User not authorized | Run `add-sso-user.js` with your Microsoft email. |
| Network Error / Failed to login | Start backend: `cd backend; npm run dev` |
| Too many requests | Restart backend (`Ctrl+C`, then `npm run dev`) |
| MySQL / Workbench errors | Stop using them. Run `node backend\scripts\setup-embedded.js` |

Stay on **`main` only**.
