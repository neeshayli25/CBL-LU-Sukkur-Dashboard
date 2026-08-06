#Requires -Version 5.1
<#
.SYNOPSIS
  One-command local run for CBL HSE on Windows.

.DESCRIPTION
  1) Ensures embedded SQLite DB + .env files exist
  2) Starts backend (port 5000) in a new window
  3) Starts frontend (port 5173) in a new window

  Login: Sign in (Local Preview)
  User:  superadmin@cblapp.com
  Pass:  Admin@123!

  Open: http://localhost:5173
  No MySQL Workbench. No Docker required.
#>

$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent $PSScriptRoot
if (-not (Test-Path (Join-Path $Root "backend\package.json"))) {
  # This script lives at repo-root/start-local.ps1
  $Root = $PSScriptRoot
}
if (-not (Test-Path (Join-Path $Root "backend\package.json"))) {
  Write-Host "Run this from the repo root: .\\start-local.ps1" -ForegroundColor Red
  exit 1
}

Set-Location $Root
Write-Host "==> Repo: $Root" -ForegroundColor Cyan

$sqlite = Join-Path $Root "backend\data\cbl.sqlite"
$backendEnv = Join-Path $Root "backend\.env"
if (-not (Test-Path $sqlite) -or -not (Test-Path $backendEnv)) {
  Write-Host "==> First-time setup (embedded database)..." -ForegroundColor Cyan
  node (Join-Path $Root "backend\scripts\setup-embedded.js")
  if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
} else {
  Write-Host "==> Embedded DB already present" -ForegroundColor Green
}

Write-Host "==> Starting backend on :5000 ..." -ForegroundColor Cyan
Start-Process powershell -WorkingDirectory (Join-Path $Root "backend") -ArgumentList "-NoExit", "-Command", "npm run dev"

Start-Sleep -Seconds 3

Write-Host "==> Starting frontend on :5173 ..." -ForegroundColor Cyan
Start-Process powershell -WorkingDirectory (Join-Path $Root "apps\management-dashboard") -ArgumentList "-NoExit", "-Command", "npm run dev"

Write-Host ""
Write-Host "Open:  http://localhost:5173" -ForegroundColor Green
Write-Host "Login: Sign in (Local Preview)" -ForegroundColor Green
Write-Host "User:  superadmin@cblapp.com" -ForegroundColor Green
Write-Host "Pass:  Admin@123!" -ForegroundColor Green
Write-Host ""
Write-Host "Avatar must be SA (not UP). Dashboard KPIs should be non-zero." -ForegroundColor Yellow
Write-Host "Microsoft SSO is optional later — see START_HERE.md" -ForegroundColor Yellow
