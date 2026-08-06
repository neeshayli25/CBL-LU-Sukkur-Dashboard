#Requires -Version 5.1
<#
.SYNOPSIS
  One-shot local setup using the project-embedded SQLite database.
  No MySQL Workbench, no Docker, no local MySQL service required.

.DESCRIPTION
  1) Writes backend/.env for DB_DIALECT=sqlite (file: backend/data/cbl.sqlite)
  2) Writes frontend preview .env (real JWT login)
  3) Creates schema, seeds admin user, seeds demo HSE log data
#>

$ErrorActionPreference = "Stop"
$Root = Resolve-Path (Join-Path $PSScriptRoot "..\..")
$Root = $Root.Path
$Backend = Join-Path $Root "backend"
$DataDir = Join-Path $Backend "data"

if (-not (Test-Path (Join-Path $Backend "package.json"))) {
  Write-Host "Could not locate backend from $PSScriptRoot" -ForegroundColor Red
  exit 1
}

New-Item -ItemType Directory -Force -Path $DataDir | Out-Null
$SqlitePath = (Join-Path $DataDir "cbl.sqlite") -replace '\\', '/'

$backendEnv = Join-Path $Backend ".env"
$envText = @"
NODE_ENV=development
PORT=5000
APP_NAME=CBL-Backend
APP_URL=http://localhost:5000
CLIENT_URL=http://localhost:5173

DB_DIALECT=sqlite
DB_STORAGE=$SqlitePath
DB_HOST=localhost
DB_PORT=3306
DB_NAME=cbl_db
DB_USER=root
DB_PASSWORD=
DB_POOL_MIN=1
DB_POOL_MAX=5
DB_LOGGING=false

JWT_ACCESS_SECRET=cbl_access_secret_key_32chars_xx
JWT_REFRESH_SECRET=cbl_refresh_secret_key_32chars_x
JWT_VERIFY_SECRET=cbl_verify_secret_key_32chars_xx
JWT_RESET_SECRET=cbl_reset_secret_key_32chars_xxx
JWT_ACCESS_EXPIRY=8h
JWT_REFRESH_EXPIRY=7d
JWT_VERIFY_EXPIRY=24h
JWT_RESET_EXPIRY=1h

REDIS_HOST=127.0.0.1
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0

MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_SECURE=false
MAIL_USER=dev@cblapp.com
MAIL_PASSWORD=dev-app-password
MAIL_FROM_NAME=CBL App
MAIL_FROM_EMAIL=noreply@cblapp.com

STORAGE_DRIVER=local
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX=1000
AUTH_RATE_LIMIT_MAX=100
LOG_LEVEL=info
LOG_DIR=logs
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173
ENCRYPTION_KEY=cbl_local_encryption_key_32char!
"@

Set-Content -Path $backendEnv -Value $envText -Encoding UTF8
Write-Host "==> Wrote $backendEnv (embedded SQLite)" -ForegroundColor Green

$feEnv = Join-Path $Root "apps\management-dashboard\.env"
$feText = @"
VITE_API_URL=/api/v1
VITE_BYPASS_AUTH=true
VITE_PREVIEW_EMAIL=superadmin@cblapp.com
VITE_PREVIEW_PASSWORD=Admin@123!
VITE_MSAL_CLIENT_ID=6ac94d07-9ab4-470f-924d-6361d471fb0e
VITE_MSAL_TENANT_ID=90dccc47-53bf-449c-876c-c5649f21f94d
"@
Set-Content -Path $feEnv -Value $feText -Encoding UTF8
Write-Host "==> Wrote $feEnv" -ForegroundColor Green

Push-Location $Backend
Write-Host "==> Installing backend deps (if needed)..." -ForegroundColor Cyan
npm install --no-fund --no-audit | Out-Null
Write-Host "==> Bootstrapping embedded database..." -ForegroundColor Cyan
node scripts\bootstrap-embedded-db.js
if ($LASTEXITCODE -ne 0) {
  Pop-Location
  Write-Host "Bootstrap failed" -ForegroundColor Red
  exit 1
}
Pop-Location

Write-Host ""
Write-Host "Setup complete. Run two terminals:" -ForegroundColor Green
Write-Host "  cd backend; npm run dev"
Write-Host "  cd apps\management-dashboard; npm run dev -- --host 0.0.0.0"
Write-Host "Then open http://localhost:5173 and Sign in (Local Preview)"
Write-Host "  superadmin@cblapp.com / Admin@123!"
Write-Host "Database file: $SqlitePath"
Write-Host "No MySQL Workbench required."
