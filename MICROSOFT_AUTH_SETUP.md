# Microsoft Entra ID (SSO) setup — CBL HSE Dashboard

This app uses **Microsoft login in the browser (MSAL)**, then the backend
checks that the Microsoft account email already exists in the `users` table
and issues its own JWT (`POST /api/v1/auth/verify-email`).

```
Browser → Microsoft login popup
       → gets your work email
       → POST /api/v1/auth/verify-email { email }
       → backend returns JWT
       → all /log-sheets/* calls use Authorization: Bearer <jwt>
```

**Important:** Microsoft does **not** create users in this app.  
The email must already exist in your database (seeded or inserted).

---

## Part A — Create the Entra app (Azure Portal)

Do this once (you or IT). You need access to:
https://portal.azure.com → **Microsoft Entra ID**

### A1. Open App registrations

1. Go to **Microsoft Entra ID**
2. Left menu → **App registrations**
3. Click **+ New registration**

### A2. Register the app

| Field | Value |
|--------|--------|
| Name | `CBL LU Sukkur HSE Dashboard` (any clear name) |
| Supported account types | **Accounts in this organizational directory only** (single tenant) |
| Redirect URI | Platform: **Single-page application (SPA)** |
| Redirect URI value | `http://localhost:5173` |

Click **Register**.

### A3. Copy IDs

On the app **Overview** page, copy:

- **Application (client) ID** → this is `VITE_MSAL_CLIENT_ID`
- **Directory (tenant) ID** → this is `VITE_MSAL_TENANT_ID`

### A4. Add redirect URIs (SPA)

1. Left menu → **Authentication**
2. Under **Single-page application** → **Add URI**, add all you use:

```
http://localhost:5173
http://localhost:5173/
http://127.0.0.1:5173
```

If you later deploy to a real URL, add that origin too (e.g. `https://hse.yourcompany.com`).

3. Under **Implicit grant and hybrid flows** (if shown): you usually do **not** need to enable ID/Access tokens for modern MSAL popup SPA — leave defaults unless Microsoft docs for your tenant say otherwise.
4. **Save**

### A5. API permissions

1. Left menu → **API permissions**
2. Ensure **Microsoft Graph** → **User.Read** (Delegated) is present  
   (often added by default)
3. Click **Grant admin consent for \<your org\>** if you have admin rights  
   (otherwise ask an Entra admin)

### A6. (Optional) Restrict who can sign in

Enterprise applications → your app → **Properties** / **Users and groups**  
Assign only the plant users who should access HSE.

---

## Part B — Put Entra IDs into the frontend

Edit `apps/management-dashboard/.env`:

```env
VITE_API_URL=/api/v1

# Turn OFF local preview password login
VITE_BYPASS_AUTH=false

# From Azure Overview (Part A3)
VITE_MSAL_CLIENT_ID=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
VITE_MSAL_TENANT_ID=yyyyyyyy-yyyy-yyyy-yyyy-yyyyyyyyyyyy
```

Save the file, then **restart the Vite frontend** (env vars load only at start):

```powershell
cd apps\management-dashboard
npm run dev -- --host 0.0.0.0
```

The login button should say **Sign in with Microsoft SSO** (not Local Preview).

---

## Part C — Ensure your Microsoft email exists in the DB

SSO fails with **“User not authorized”** if the email is missing from `users`.

### Option 1 — Use the seeded superadmin (only if that email is a real Entra account)

Seeded user: `superadmin@cblapp.com`  
This only works if someone can actually sign into Microsoft with that address (usually **not** true). Prefer Option 2.

### Option 2 — Insert your work email (recommended)

1. Start the backend with embedded DB (or your working DB).
2. Insert a user whose **email matches your Microsoft account exactly** (case-insensitive match is typical; still use the real UPN).

Example using Node against embedded SQLite (from `backend/` after setup):

```powershell
cd backend
node -e "require('dotenv').config(); const bcrypt=require('bcryptjs'); const {v4:uuid}=require('uuid'); const {sequelize}=require('./src/database/connection'); (async()=>{ await sequelize.authenticate(); require('./src/database/models'); const User=require('./src/modules/users/user.model'); const Role=require('./src/modules/users/role.model'); const role=await Role.findOne({where:{name:'super_admin'}}); const email='YOUR.NAME@yourcompany.com'; const existing=await User.findOne({where:{email}}); if(existing){ console.log('already exists', existing.id); process.exit(0);} const u=await User.create({ firstName:'Nisha', lastName:'Ali', email, password: await bcrypt.hash('TempPass@123!',12), status:true, isEmailVerified:true, roleId:role.id }); console.log('created', u.id, u.email); process.exit(0); })().catch(e=>{console.error(e); process.exit(1);})"
```

Replace `YOUR.NAME@yourcompany.com` with your real Microsoft sign-in email.

You can also use password login for that user later; for SSO only the email + `status=true` + `isEmailVerified=true` matter.

---

## Part D — Run backend + database first

Microsoft login still needs a healthy API.

### Recommended local DB (no Workbench)

```powershell
cd C:\Users\Nisha Ali\CBL-LU-Sukkur-Dashboard
git pull origin main
node backend\scripts\setup-embedded.js
```

Creates `backend/data/cbl.sqlite`, seeds roles/admin/demo data.

### Start backend

```powershell
cd backend
npm run dev
```

Check:

```powershell
curl http://localhost:5000/api/health
```

---

## Part E — Login flow (what you click)

1. Open http://localhost:5173  
2. Click **Sign in with Microsoft SSO**  
3. Microsoft popup: pick your work account / enter password / MFA  
4. App reads your email from the Microsoft account  
5. App calls backend `POST /api/v1/auth/verify-email`  
6. Backend returns JWT → avatar should be your initials (not **UP**)  
7. Dashboard APIs should succeed (non-zero data if DB was seeded)

### If it fails — map the message

| What you see | Meaning | Fix |
|--------------|---------|-----|
| Popup blocked / AADSTS error about redirect URI | Redirect URI not registered | Part A4 — add exact origin |
| `invalid_client` / placeholder client id | `.env` still has placeholders | Part B — real client/tenant IDs + restart Vite |
| Login OK then **User not authorized** | Email not in `users` table | Part C — insert your email |
| Network Error / Failed to login — start backend | API not running or proxy broken | Part D — `npm run dev` in `backend` |
| 401 Authentication token is required | No JWT on API calls | Complete SSO (or temporary `VITE_BYPASS_AUTH=true` password login) |
| Avatar **UP** | Old preview mode without JWT | Set `VITE_BYPASS_AUTH=false` for SSO, or pull latest `main` |

---

## Part F — Temporary fallback (while Entra is pending)

If Azure admin access is delayed, keep the app usable:

```env
VITE_BYPASS_AUTH=true
VITE_PREVIEW_EMAIL=superadmin@cblapp.com
VITE_PREVIEW_PASSWORD=Admin@123!
```

Button: **Sign in (Local Preview)** → password login → real JWT.  
Switch back to `false` when Entra IDs are ready.

---

## Part G — Smooth backend + database checklist (after SSO works)

1. **One database only** — prefer embedded SQLite for local Windows:
   - `backend/.env` has `DB_DIALECT=sqlite`
   - File: `backend/data/cbl.sqlite`
   - Do **not** open MySQL Workbench for day-to-day work
2. **Two terminals always running**
   - `backend` → `npm run dev` (port 5000)
   - `apps/management-dashboard` → `npm run dev -- --host 0.0.0.0` (port 5173)
3. **Confirm JWT** — after login, DevTools → Network → any `/api/v1/log-sheets/...` request → Request Headers include `Authorization: Bearer ...`
4. **Import plant Excel** (optional, for full plant data):
   ```powershell
   cd backend
   node scripts\import-log-sheets.js
   node scripts\import-incident-log.js
   ```
5. **Forms** — create/edit on Hazard / Near Miss / Incident / Action Tracker should save (watch Network for 201/200, not 401)
6. **Production later** — use MySQL (`DB_DIALECT=mysql`) on a server; keep Entra redirect URIs for the production HTTPS URL

---

## Code map (for developers)

| Piece | Path |
|-------|------|
| MSAL config | `packages/auth/src/msalConfig.ts` |
| Auth provider | `packages/auth/src/components/AuthProvider.tsx` |
| Login (SSO vs preview) | `packages/auth/src/hooks/useAuth.ts` |
| SSO API call | `packages/api/src/authClient.ts` → `POST /auth/verify-email` |
| Backend SSO handler | `backend/src/modules/auth/auth.controller.js` → `verifyEmailExists` |
| Frontend env | `apps/management-dashboard/.env` |
