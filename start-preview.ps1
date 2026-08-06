#Requires -Version 5.1
<#
.SYNOPSIS
  Preview / presentation mode — cloud MySQL, plant Excel data, Local Preview login.

.DESCRIPTION
  Uses a REMOTE cloud MySQL database (no local Windows MySQL service).
  1) Reads backend/.env.cloud for DB credentials
  2) Migrates, seeds, imports your plant Excel files from data/imports/
  3) Starts backend :5000 and frontend :5173

  Login: Sign in (Local Preview)
  User:  superadmin@cblapp.com / Admin@123!
  Open:  http://localhost:5173
#>

$ErrorActionPreference = "Stop"
$Root = $PSScriptRoot
if (-not (Test-Path (Join-Path $Root "backend\package.json"))) {
  Write-Host "Run from repo root: .\start-preview.ps1" -ForegroundColor Red
  exit 1
}

$CloudEnv = Join-Path $Root "backend\.env.cloud"
if (-not (Test-Path $CloudEnv)) {
  Write-Host ""
  Write-Host "Missing backend\.env.cloud" -ForegroundColor Red
  Write-Host ""
  Write-Host "Copy backend\.env.cloud.example to backend\.env.cloud and fill in your cloud MySQL:" -ForegroundColor Yellow
  Write-Host "  DB_HOST=your-cloud-host.example.com" -ForegroundColor Yellow
  Write-Host "  DB_PORT=3306" -ForegroundColor Yellow
  Write-Host "  DB_NAME=cbl_db" -ForegroundColor Yellow
  Write-Host "  DB_USER=your_user" -ForegroundColor Yellow
  Write-Host "  DB_PASSWORD=your_password" -ForegroundColor Yellow
  Write-Host "  DB_SSL=true" -ForegroundColor Yellow
  Write-Host ""
  Write-Host "Free cloud MySQL: Railway, Aiven, db4free.net (see START_HERE.md)" -ForegroundColor Cyan
  exit 1
}

Set-Location $Root
Write-Host "==> Repo: $Root" -ForegroundColor Cyan
Write-Host "==> Using cloud DB from backend\.env.cloud" -ForegroundColor Cyan

Write-Host "==> Installing root workspace deps..." -ForegroundColor Cyan
npm install --no-fund --no-audit
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Write-Host "==> Cloud MySQL setup + migrate/seed + import plant data..." -ForegroundColor Cyan
node (Join-Path $Root "backend\scripts\setup-cloud-mysql.js")
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Write-Host "==> Starting backend on :5000 ..." -ForegroundColor Cyan
Start-Process powershell -WorkingDirectory (Join-Path $Root "backend") -ArgumentList "-NoExit","-Command","npm run dev"

Start-Sleep -Seconds 4

Write-Host "==> Starting frontend on :5173 ..." -ForegroundColor Cyan
Start-Process powershell -WorkingDirectory (Join-Path $Root "apps\management-dashboard") -ArgumentList "-NoExit","-Command","npm run dev"

Write-Host ""
Write-Host "Open:  http://localhost:5173" -ForegroundColor Green
Write-Host "Login: Sign in (Local Preview)" -ForegroundColor Green
Write-Host "User:  superadmin@cblapp.com" -ForegroundColor Green
Write-Host "Pass:  Admin@123!" -ForegroundColor Green
Write-Host "All plant log sheets are in data/imports/ and loaded into cloud DB." -ForegroundColor Yellow
