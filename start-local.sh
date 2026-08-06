#!/usr/bin/env bash
# One-command localhost run (Linux / cloud VM)
set -euo pipefail

ROOT="$(cd "$(dirname "$0")" && pwd)"
cd "$ROOT"

echo "==> CBL HSE localhost setup"

# Start MySQL if systemd available
if command -v service >/dev/null 2>&1; then
  service mysql start 2>/dev/null || true
fi

echo "==> Installing dependencies..."
npm install --no-fund --no-audit

echo "==> MySQL setup + migrate/seed + import plant data..."
node backend/scripts/setup-local-mysql.js --port 3306

echo "==> Starting backend on :5000 ..."
(cd backend && npm run dev) &
sleep 4

echo "==> Starting frontend on :5173 ..."
(cd apps/management-dashboard && npm run dev) &

echo ""
echo "Open:  http://localhost:5173"
echo "Login: Sign in (Local Preview)"
echo "User:  superadmin@cblapp.com / Admin@123!"
