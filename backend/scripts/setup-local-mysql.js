'use strict';

/**
 * Windows-friendly local setup using the installed MySQL service
 * (MySQL80 / MySQL80_New) — no Visual Studio, no sqlite3 native build,
 * no Workbench required for day-to-day use.
 *
 * From repo root: node backend/scripts/setup-local-mysql.js
 */

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const backendDir = path.join(__dirname, '..');
const rootDir = path.join(backendDir, '..');

function run(cmd, args, cwd) {
  const isWin = process.platform === 'win32';
  const bin = isWin && cmd === 'npm' ? 'npm.cmd' : cmd;
  const result = spawnSync(bin, args, {
    cwd,
    stdio: 'inherit',
    shell: isWin,
    env: process.env,
  });
  if (result.status !== 0) {
    throw new Error(`${cmd} ${args.join(' ')} failed (${result.status})`);
  }
}

console.log('Installing backend dependencies (mysql2; sqlite3 optional)...');
run('npm', ['install', '--no-fund', '--no-audit'], backendDir);

const backendEnv = `NODE_ENV=development
PORT=5000
APP_NAME=CBL-Backend
APP_URL=http://localhost:5000
CLIENT_URL=http://localhost:5173

DB_DIALECT=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_NAME=cbl_db
DB_USER=root
DB_PASSWORD=secret
DB_POOL_MIN=2
DB_POOL_MAX=10
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
`;

fs.writeFileSync(path.join(backendDir, '.env'), backendEnv, 'utf8');
console.log('Wrote backend/.env (MySQL 127.0.0.1:3306 / password secret)');

const feEnv = `VITE_API_URL=/api/v1
VITE_BYPASS_AUTH=true
VITE_PREVIEW_EMAIL=superadmin@cblapp.com
VITE_PREVIEW_PASSWORD=Admin@123!
VITE_MSAL_CLIENT_ID=6ac94d07-9ab4-470f-924d-6361d471fb0e
VITE_MSAL_TENANT_ID=90dccc47-53bf-449c-876c-c5649f21f94d
`;
fs.writeFileSync(path.join(rootDir, 'apps', 'management-dashboard', '.env'), feEnv, 'utf8');
console.log('Wrote apps/management-dashboard/.env');

console.log('Running migrations...');
run('npm', ['run', 'migrate'], backendDir);
console.log('Running seeders...');
try {
  run('npm', ['run', 'seed'], backendDir);
} catch (err) {
  console.warn('Seed reported an error (often OK if data already exists):', err.message);
}

console.log('\nMySQL local setup complete.');
console.log('Ensure Windows service MySQL80_New (or MySQL80) is Running.');
console.log('Root password must be: secret');
console.log('Database: cbl_db');
console.log('Then: cd backend && npm run dev');
console.log('And:  cd apps/management-dashboard && npm run dev');
console.log('Login: superadmin@cblapp.com / Admin@123!');
