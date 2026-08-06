#Requires -Version 5.1
<#
.SYNOPSIS
  One-command local run for CBL HSE on Windows (MySQL - no Visual Studio / sqlite3 build).

.DESCRIPTION
  Uses your installed Windows MySQL (MySQL80_New) with:
    host 127.0.0.1  port 3306  user root  password secret  db cbl_db

  1) npm install (root + backend)
  2) Write .env, migrate, seed
  3) Start backend :5000 and frontend :5173

  Login: Sign in (Local Preview)
  User:  superadmin@cblapp.com / Admin@123!
  Open:  http://localhost:5173
#>

$ErrorActionPreference = "Stop"
$Root = $PSScriptRoot
if (-not (Test-Path (Join-Path $Root "backend\package.json"))) {
  Write-Host "Run from repo root: .\start-local.ps1" -ForegroundColor Red
  exit 1
}

Set-Location $Root
Write-Host "==> Repo: $Root" -ForegroundColor Cyan

# Make sure MySQL Windows service is running
$mysqlSvc = Get-Service -Name "*mysql*" -ErrorAction SilentlyContinue | Where-Object { $_.Status -eq 'Running' }
if (-not $mysqlSvc) {
  Write-Host "==> Starting MySQL Windows service..." -ForegroundColor Yellow
  $candidate = Get-Service -Name "MySQL80_New","MySQL80" -ErrorAction SilentlyContinue | Select-Object -First 1
  if ($candidate) {
    try { Start-Service $candidate.Name } catch { Write-Host "Could not start $($candidate.Name). Start it in services.msc" -ForegroundColor Red }
  } else {
    Write-Host "No MySQL service found. Install MySQL 8 or start MySQL80_New." -ForegroundColor Red
    exit 1
  }
} else {
  Write-Host "==> MySQL service running: $($mysqlSvc.Name -join ', ')" -ForegroundColor Green
}

Write-Host "==> Installing root workspace deps (vite)..." -ForegroundColor Cyan
npm install --no-fund --no-audit
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Write-Host "==> Configuring MySQL backend + migrate/seed..." -ForegroundColor Cyan
node (Join-Path $Root "backend\scripts\setup-local-mysql.js")
if ($LASTEXITCODE -ne 0) {
  Write-Host ""
  Write-Host "MySQL setup failed. Confirm root password is 'secret' and database cbl_db exists:" -ForegroundColor Red
  Write-Host '  & "C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe" -u root -psecret -e "CREATE DATABASE IF NOT EXISTS cbl_db;"'
  exit 1
}

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
Write-Host "Avatar must be SA (not UP)." -ForegroundColor Yellow
