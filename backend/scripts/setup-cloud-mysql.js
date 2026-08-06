'use strict';

/**
 * Configure backend for a remote/cloud MySQL database.
 * Reads credentials from backend/.env.cloud (preferred) or process env.
 *
 * From repo root:
 *   node backend/scripts/setup-cloud-mysql.js
 *
 * Create backend/.env.cloud first (see backend/.env.cloud.example).
 */

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const backendDir = path.join(__dirname, '..');
const rootDir = path.join(backendDir, '..');
const cloudEnvPath = path.join(backendDir, '.env.cloud');

function loadCloudEnv() {
  const vars = {};
  if (fs.existsSync(cloudEnvPath)) {
    fs.readFileSync(cloudEnvPath, 'utf8')
      .split('\n')
      .forEach((line) => {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) return;
        const eq = trimmed.indexOf('=');
        if (eq === -1) return;
        vars[trimmed.slice(0, eq).trim()] = trimmed.slice(eq + 1).trim();
      });
  }
  ['DB_HOST', 'DB_PORT', 'DB_NAME', 'DB_USER', 'DB_PASSWORD', 'DB_SSL'].forEach((key) => {
    if (process.env[key]) vars[key] = process.env[key];
  });
  return vars;
}

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

const cloud = loadCloudEnv();

if (!cloud.DB_HOST || !cloud.DB_NAME || !cloud.DB_USER) {
  console.error(`
Cloud MySQL credentials missing.

Create backend/.env.cloud with:

  DB_HOST=your-cloud-mysql-host.example.com
  DB_PORT=3306
  DB_NAME=cbl_db
  DB_USER=your_user
  DB_PASSWORD=your_password
  DB_SSL=true

Free options: Railway, Aiven, PlanetScale, db4free.net
See START_HERE.md for step-by-step.
`);
  process.exit(1);
}

console.log('Installing backend dependencies...');
run('npm', ['install', '--no-fund', '--no-audit'], backendDir);

const sslLine = cloud.DB_SSL === 'true' ? 'DB_SSL=true' : 'DB_SSL=false';

const backendEnv = `NODE_ENV=development
PORT=5000
APP_NAME=CBL-Backend
APP_URL=http://localhost:5000
CLIENT_URL=http://localhost:5173

DB_DIALECT=mysql
DB_HOST=${cloud.DB_HOST}
DB_PORT=${cloud.DB_PORT || 3306}
DB_NAME=${cloud.DB_NAME}
DB_USER=${cloud.DB_USER}
DB_PASSWORD=${cloud.DB_PASSWORD || ''}
${sslLine}
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
console.log(`Wrote backend/.env (cloud MySQL @ ${cloud.DB_HOST})`);

const feEnv = `VITE_API_URL=/api/v1
VITE_BYPASS_AUTH=true
VITE_PREVIEW_EMAIL=superadmin@cblapp.com
VITE_PREVIEW_PASSWORD=Admin@123!
`;
fs.writeFileSync(path.join(rootDir, 'apps', 'management-dashboard', '.env'), feEnv, 'utf8');
console.log('Wrote apps/management-dashboard/.env (Local Preview)');

console.log('Running migrations...');
run('npm', ['run', 'migrate'], backendDir);
console.log('Running seeders...');
try {
  run('npm', ['run', 'seed'], backendDir);
} catch (err) {
  console.warn('Seed reported an error (often OK if data already exists):', err.message);
}

console.log('Importing plant Excel data...');
run('node', ['scripts/import-plant-data.js'], backendDir);

console.log('\nCloud MySQL setup complete.');
console.log('Start backend:  cd backend && npm run dev');
console.log('Start frontend: cd apps/management-dashboard && npm run dev');
console.log('Login: superadmin@cblapp.com / Admin@123!');
