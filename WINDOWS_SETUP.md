# Windows local setup (MySQL access denied fix)

The error `Access denied for user 'root'@'localhost' (using password: YES)` means
your **Windows MySQL password does not match** `backend/.env` (`DB_PASSWORD`).

## Recommended fix (Docker MySQL on port 3307)

1. Install/start **Docker Desktop**
2. From the repo root in PowerShell:

```powershell
cd C:\Users\Nisha Ali\CBL-LU-Sukkur-Dashboard
powershell -ExecutionPolicy Bypass -File .\backend\scripts\setup-windows.ps1
```

This will:
- start MySQL on **127.0.0.1:3307** with password **`secret`**
- write `backend/.env` and frontend `.env`
- run `npm run migrate` + `npm run seed`

3. Run the app (two terminals):

```powershell
cd backend
npm run dev
```

```powershell
cd apps\management-dashboard
npm run dev
```

4. Open http://localhost:5173 → **Sign in (Local Preview)**  
   User: `superadmin@cblapp.com` / `Admin@123!`

5. (Optional) Import Excel sheets once backend is healthy:

```powershell
cd backend
node scripts\import-log-sheets.js
node scripts\import-incident-log.js
```

> Note: Docker MySQL uses port **3307** so it does not fight an existing Windows MySQL service on 3306.

## Alternative: keep your installed MySQL

If you prefer local MySQL (not Docker):

1. Open MySQL client with your real root password
2. Run:

```sql
ALTER USER 'root'@'localhost' IDENTIFIED WITH mysql_native_password BY 'secret';
FLUSH PRIVILEGES;
CREATE DATABASE IF NOT EXISTS cbl_db;
```

3. In `backend\.env` set:

```env
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=root
DB_PASSWORD=secret
DB_NAME=cbl_db
ENCRYPTION_KEY=cbl_encryption_key_32_chars_ab
```

4. Then `npm run migrate` && `npm run seed` && `npm run dev`

## Quick checks

```powershell
# Docker MySQL
docker ps
mysql -h 127.0.0.1 -P 3307 -u root -psecret -e "SHOW DATABASES;"

# Backend health
curl http://localhost:5000/api/health
```

## “Too many requests. Please slow down.”

Login is rate-limited (about 10 failed tries / 15 minutes). Preview sign-in
retries can hit that quickly.

**Immediate unblock:** in the backend terminal press `Ctrl+C`, then run
`npm run dev` again. The counter is in memory and resets on restart.
Then click **Sign in (Local Preview)** once.

On current `main`/latest code, rate limits are skipped when
`NODE_ENV=development`.
