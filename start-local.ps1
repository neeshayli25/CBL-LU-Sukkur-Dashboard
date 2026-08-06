#Requires -Version 5.1
<#
.SYNOPSIS
  One-command localhost run — backend + frontend + MySQL + plant data.

.DESCRIPTION
  Tries Docker MySQL (port 3307) first — most reliable on Windows.
  Falls back to Windows MySQL service (port 3306).

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
Write-Host "==> CBL HSE localhost setup" -ForegroundColor Cyan
Write-Host "==> Repo: $Root" -ForegroundColor Cyan

$DbPort = 3306
$UsedDocker = $false

# Prefer Docker MySQL — avoids Windows MySQL password/service issues
try {
  docker info 2>$null | Out-Null
  Write-Host "==> Docker found — starting MySQL on port 3307 ..." -ForegroundColor Cyan
  docker compose -f docker-compose.db.yml up -d 2>$null
  $ready = $false
  for ($i = 0; $i -lt 30; $i++) {
    $status = docker inspect --format='{{.State.Health.Status}}' cbl-mysql 2>$null
    if ($status -eq "healthy") { $ready = $true; break }
    Start-Sleep -Seconds 2
  }
  if ($ready) {
    $DbPort = 3307
    $UsedDocker = $true
    Write-Host "==> Docker MySQL healthy on port 3307" -ForegroundColor Green
  } else {
    Write-Host "==> Docker MySQL not ready — falling back to Windows MySQL" -ForegroundColor Yellow
  }
} catch {
  Write-Host "==> Docker not available — using Windows MySQL service" -ForegroundColor Yellow
}

if (-not $UsedDocker) {
  $mysqlSvc = Get-Service -Name "*mysql*" -ErrorAction SilentlyContinue | Where-Object { $_.Status -eq 'Running' }
  if (-not $mysqlSvc) {
    Write-Host "==> Starting MySQL Windows service..." -ForegroundColor Yellow
    $candidate = Get-Service -Name "MySQL80_New","MySQL80" -ErrorAction SilentlyContinue | Select-Object -First 1
    if ($candidate) {
      try {
        Start-Service $candidate.Name
        Write-Host "==> Started $($candidate.Name)" -ForegroundColor Green
      } catch {
        Write-Host "Could not start $($candidate.Name). Install Docker Desktop or start MySQL in services.msc" -ForegroundColor Red
        exit 1
      }
    } else {
      Write-Host "No MySQL service found." -ForegroundColor Red
      Write-Host "Install Docker Desktop (recommended) OR MySQL 8, then re-run." -ForegroundColor Yellow
      exit 1
    }
  } else {
    Write-Host "==> Windows MySQL running: $($mysqlSvc.Name)" -ForegroundColor Green
  }
  $DbPort = 3306
}

Write-Host "==> Installing dependencies..." -ForegroundColor Cyan
npm install --no-fund --no-audit
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Write-Host "==> DB setup (port $DbPort) + migrate/seed + import plant data..." -ForegroundColor Cyan
node (Join-Path $Root "backend\scripts\setup-local-mysql.js") --port $DbPort
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
Write-Host "DB:    127.0.0.1:$DbPort/cbl_db (password: secret)" -ForegroundColor Yellow
