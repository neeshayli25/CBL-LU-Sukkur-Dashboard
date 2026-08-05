# Windows local setup

Use this when the backend fails with MySQL errors, or when PowerShell says:

`mysql : The term 'mysql' is not recognized...`

Because Docker Desktop needs BIOS virtualization (often unavailable on this PC),
**install MySQL Server locally** and point the app at it.

---

## 1) Check whether MySQL is already installed

In **PowerShell**:

```powershell
# Is the MySQL Windows service present?
Get-Service -Name "*mysql*"

# Search common install folders for mysql.exe
Get-ChildItem "C:\Program Files\MySQL" -Recurse -Filter mysql.exe -ErrorAction SilentlyContinue |
  Select-Object -ExpandProperty FullName

Get-ChildItem "C:\Program Files\MariaDB*" -Recurse -Filter mysql.exe -ErrorAction SilentlyContinue |
  Select-Object -ExpandProperty FullName
```

### If `mysql.exe` is found (example path)

Use the full path once:

```powershell
& "C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe" -u root -p
```

Or add `bin` to PATH for this session:

```powershell
$env:Path += ";C:\Program Files\MySQL\MySQL Server 8.0\bin"
mysql -u root -p
```

(Adjust `8.0` if your folder is `8.4` / `9.0`.)

To make PATH permanent:  
**Settings → System → About → Advanced system settings → Environment Variables → Path → Edit → New**  
→ paste the `...\bin` folder → OK → **open a new PowerShell**.

### If nothing is found → install MySQL 8

1. Download **MySQL Installer for Windows**  
   https://dev.mysql.com/downloads/installer/
2. Choose **MySQL Server 8.x** (Developer / Server only is fine)
3. During setup:
   - Config type: **Development Computer**
   - Authentication: **Use Strong Password Encryption** (OK)
   - Set root password to: **`secret`**
   - Enable **Start MySQL Server at System Startup**
   - Optionally install **MySQL Client** / Command Line tools
4. Finish install, then **close and reopen PowerShell**
5. Retry:

```powershell
mysql -u root -p
# password: secret
```

If `mysql` is still not recognized, use the full path under  
`C:\Program Files\MySQL\MySQL Server 8.x\bin\mysql.exe` as above.

---

## 2) Create the app database

```sql
CREATE DATABASE IF NOT EXISTS cbl_db;
ALTER USER 'root'@'localhost' IDENTIFIED WITH mysql_native_password BY 'secret';
FLUSH PRIVILEGES;
```

(If you already set the root password to `secret` during install, only `CREATE DATABASE` is required.)

Start the service if needed (Admin PowerShell):

```powershell
Start-Service MySQL80
# or: Start-Service MySQL84
Get-Service -Name "*mysql*"
```

---

## 3) Configure `backend\.env`

From the repo root, ensure `backend\.env` has at least:

```env
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=root
DB_PASSWORD=secret
DB_NAME=cbl_db
ENCRYPTION_KEY=cbl_encryption_key_32_chars_ab
JWT_SECRET=cbl_jwt_secret_change_me_local_dev
JWT_REFRESH_SECRET=cbl_jwt_refresh_secret_local_dev
```

`ENCRYPTION_KEY` must be **exactly 32 characters**.

Frontend `apps\management-dashboard\.env`:

```env
VITE_API_URL=/api/v1
VITE_BYPASS_AUTH=true
```

---

## 4) Migrate, seed, run

```powershell
cd C:\Users\Nisha Ali\CBL-LU-Sukkur-Dashboard\backend
npm install
npm run migrate
npm run seed
npm run dev
```

Second terminal:

```powershell
cd C:\Users\Nisha Ali\CBL-LU-Sukkur-Dashboard
npm install
cd apps\management-dashboard
npm run dev -- --host 0.0.0.0
```

Open http://localhost:5173 → **Sign in (Local Preview)**  
`superadmin@cblapp.com` / `Admin@123!`

Health check:

```powershell
curl http://localhost:5000/api/health
```

---

## 5) Optional: import Excel log sheets

Put the plant Excel files where the import scripts expect them (or edit the script paths), then:

```powershell
cd backend
node scripts\import-log-sheets.js
node scripts\import-incident-log.js
```

---

## Docker note (only if virtualization works)

If Docker Desktop later works (BIOS virtualization + WSL2 enabled), you can instead run:

```powershell
powershell -ExecutionPolicy Bypass -File .\backend\scripts\setup-windows.ps1
```

That starts MySQL on port **3307** with password `secret`. Until virtualization is available, use local MySQL on **3306** as above.
