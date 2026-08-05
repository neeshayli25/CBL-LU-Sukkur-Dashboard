#Requires -Version 5.1
<#
.SYNOPSIS
  One-shot local setup for CBL HSE on Windows (Docker MySQL + migrate/seed).

.DESCRIPTION
  1) Starts MySQL (port 3307) + Redis via Docker
  2) Writes backend/.env with matching credentials
  3) Writes apps/management-dashboard/.env for preview login
  4) Runs npm migrate + seed

  Prerequisites: Docker Desktop running, Node.js 20+
#>

$ErrorActionPreference = "Stop"
# This file lives at backend/scripts/setup-windows.ps1
$Root = Resolve-Path (Join-Path $PSScriptRoot "..\..")
$Root = $Root.Path

if (-not (Test-Path (Join-Path $Root "backend\package.json"))) {
  Write-Host "Could not locate repo root from $PSScriptRoot" -ForegroundColor Red
  exit 1
}

Write-Host "==> Repo root: $Root" -ForegroundColor Cyan

function Ensure-Docker {
  try {
    docker info | Out-Null
  } catch {
    Write-Host "Docker Desktop is not running. Start Docker Desktop, then re-run this script." -ForegroundColor Red
    exit 1
  }
}

Ensure-Docker

Write-Host "==> Starting MySQL (localhost:3307) + Redis..." -ForegroundColor Cyan
Push-Location $Root
docker compose -f docker-compose.db.yml up -d
Pop-Location

Write-Host "==> Waiting for MySQL healthy..." -ForegroundColor Cyan
$ready = $false
for ($i = 0; $i -lt 40; $i++) {
  $status = docker inspect --format='{{.State.Health.Status}}' cbl-mysql 2>$null
  if ($status -eq "healthy") { $ready = $true; break }
  Start-Sleep -Seconds 3
  Write-Host "  ... still waiting ($i)"
}
if (-not $ready) {
  Write-Host "MySQL did not become healthy. Check: docker logs cbl-mysql" -ForegroundColor Red
  exit 1
}

$backendEnv = Join-Path $Root "backend\.env"
$envText = @"
NODE_ENV=development
PORT=5000
APP_NAME=CBL-Backend
APP_URL=http://localhost:5000
CLIENT_URL=http://localhost:5173

DB_HOST=127.0.0.1
DB_PORT=3307
DB_NAME=cbl_db
DB_USER=root
DB_PASSWORD=secret
DB_POOL_MIN=2
DB_POOL_MAX=10
DB_POOL_ACQUIRE=30000
DB_POOL_IDLE=10000
DB_LOGGING=false

JWT_ACCESS_SECRET=cbl_access_secret_key_32chars_xx
JWT_REFRESH_SECRET=cbl_refresh_secret_key_32chars_x
JWT_VERIFY_SECRET=cbl_verify_secret_key_32chars_xx
JWT_RESET_SECRET=cbl_reset_secret_key_32chars_xxx
JWT_ACCESS_EXPIRY=15m
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
ENCRYPTION_KEY=cbl_encryption_key_32_chars_ab
"@

Set-Content -Path $backendEnv -Value $envText -Encoding UTF8
Write-Host "==> Wrote $backendEnv (DB_PORT=3307, DB_PASSWORD=secret)" -ForegroundColor Green

$feEnv = Join-Path $Root "apps\management-dashboard\.env"
$feText = @"
VITE_API_URL=/api/v1
VITE_BYPASS_AUTH=true
VITE_PREVIEW_EMAIL=superadmin@cblapp.com
VITE_PREVIEW_PASSWORD=Admin@123!
VITE_MSAL_CLIENT_ID=your_entra_app_client_id
VITE_MSAL_TENANT_ID=your_entra_tenant_id
"@
Set-Content -Path $feEnv -Value $feText -Encoding UTF8
Write-Host "==> Wrote $feEnv" -ForegroundColor Green

Push-Location (Join-Path $Root "backend")
if (-not (Test-Path "node_modules")) {
  Write-Host "==> npm install (backend)..." -ForegroundColor Cyan
  npm install
}
Write-Host "==> migrate..." -ForegroundColor Cyan
npm run migrate
Write-Host "==> seed..." -ForegroundColor Cyan
npm run seed
Pop-Location

Write-Host ""
Write-Host "Setup complete." -ForegroundColor Green
Write-Host "Next:"
Write-Host "  1) cd backend        ->  npm run dev"
Write-Host "  2) cd apps\management-dashboard  ->  npm run dev"
Write-Host "  3) Open http://localhost:5173  ->  Sign in (Local Preview)"
Write-Host "  Login: superadmin@cblapp.com / Admin@123!"
Write-Host ""
Write-Host "Optional: load Excel log sheets after backend is up:"
Write-Host "  cd backend"
Write-Host "  node scripts\import-log-sheets.js"
Write-Host "  node scripts\import-incident-log.js"
