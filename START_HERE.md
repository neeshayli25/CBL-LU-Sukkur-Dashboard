# START HERE - runnable on Windows

Use branch **main** only.

On Windows we use your **installed MySQL** (service `MySQL80_New`).
We do **not** use sqlite3 (it needs Visual Studio C++ to compile).
We do **not** need MySQL Workbench for day-to-day work.

---

## One-time: confirm MySQL password + database

You already did this earlier. If unsure, run:

```powershell
& "C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe" -u root -p
```

Password: `secret`

Then:

```sql
CREATE DATABASE IF NOT EXISTS cbl_db;
ALTER USER 'root'@'localhost' IDENTIFIED WITH mysql_native_password BY 'secret';
FLUSH PRIVILEGES;
EXIT;
```

Start the service if needed:

```powershell
Start-Service MySQL80_New
Get-Service *mysql*
```

---

## Run the app

```powershell
cd "C:\Users\Nisha Ali\CBL-LU-Sukkur-Dashboard"
git pull origin main
powershell -ExecutionPolicy Bypass -File .\start-local.ps1
```

This will:
1. Start MySQL service if needed
2. `npm install` (root - fixes missing vite)
3. Configure backend for MySQL `127.0.0.1:3306` / `secret` / `cbl_db`
4. Migrate + seed
5. Open backend + frontend windows

Then open **http://localhost:5173**  
**Sign in (Local Preview)**  
`superadmin@cblapp.com` / `Admin@123!`  
Avatar must be **SA**.

---

## Manual start (if script fails)

```powershell
cd "C:\Users\Nisha Ali\CBL-LU-Sukkur-Dashboard"
npm install

cd backend
node scripts\setup-local-mysql.js
npm run dev
```

Second terminal:

```powershell
cd "C:\Users\Nisha Ali\CBL-LU-Sukkur-Dashboard\apps\management-dashboard"
npm run dev
```

---

## Why sqlite3 failed

`Please install sqlite3` / `node-gyp` / Visual Studio errors mean Windows tried to compile a native module. That needs "Desktop development with C++". We switched Windows to **MySQL + mysql2** (pure JS driver, already in the project) so you do not need Visual Studio.

---

## Microsoft SSO (optional, after Local Preview works)

```powershell
cd backend
node scripts\add-sso-user.js "YOUR_MICROSOFT_EMAIL" "Nisha" "Ali" super_admin
```

Set in `apps\management-dashboard\.env`:

```env
VITE_BYPASS_AUTH=false
VITE_MSAL_CLIENT_ID=6ac94d07-9ab4-470f-924d-6361d471fb0e
VITE_MSAL_TENANT_ID=90dccc47-53bf-449c-876c-c5649f21f94d
```

Restart frontend. Open **http://localhost:5173** only.

---

## Checklist

| Check | Expected |
|-------|----------|
| `Get-Service *mysql*` | MySQL80_New Running |
| `curl http://localhost:5000/api/health` | healthy |
| Login avatar | **SA** not UP |
| Network tab on /log-sheets | `Authorization: Bearer ...` |
