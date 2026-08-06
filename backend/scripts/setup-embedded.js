'use strict';

/**
 * Cross-platform one-shot setup for project-embedded SQLite.
 * Prefer this over MySQL Workbench / Docker on Windows without virtualization.
 *
 * From repo root:  node backend/scripts/setup-embedded.js
 * From backend/:   npm run setup:embedded
 */

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const backendDir = path.join(__dirname, '..');
const rootDir = path.join(backendDir, '..');
const dataDir = path.join(backendDir, 'data');
fs.mkdirSync(dataDir, { recursive: true });

const sqlitePath = path.join(dataDir, 'cbl.sqlite').replace(/\\/g, '/');

const backendEnv = `NODE_ENV=development
PORT=5000
APP_NAME=CBL-Backend
APP_URL=http://localhost:5000
CLIENT_URL=http://localhost:5173

DB_DIALECT=sqlite
DB_STORAGE=${sqlitePath}
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
`;

fs.writeFileSync(path.join(backendDir, '.env'), backendEnv, 'utf8');
console.log('Wrote backend/.env (embedded SQLite)');

const feEnv = `VITE_API_URL=/api/v1
# true = Local Preview (password → real JWT) — use this until SSO user is seeded
VITE_BYPASS_AUTH=true
VITE_PREVIEW_EMAIL=superadmin@cblapp.com
VITE_PREVIEW_PASSWORD=Admin@123!
# Your Entra app (SPA). Set VITE_BYPASS_AUTH=false only after add-sso-user.js
VITE_MSAL_CLIENT_ID=6ac94d07-9ab4-470f-924d-6361d471fb0e
VITE_MSAL_TENANT_ID=90dccc47-53bf-449c-876c-c5649f21f94d
`;
fs.writeFileSync(path.join(rootDir, 'apps', 'management-dashboard', '.env'), feEnv, 'utf8');
console.log('Wrote apps/management-dashboard/.env');

const result = spawnSync(process.execPath, [path.join(__dirname, 'bootstrap-embedded-db.js')], {
  cwd: backendDir,
  stdio: 'inherit',
  env: { ...process.env, DB_DIALECT: 'sqlite', DB_STORAGE: sqlitePath },
});

if (result.status !== 0) {
  process.exit(result.status || 1);
}

console.log('\nSetup complete.');
console.log('  cd backend && npm run dev');
console.log('  cd apps/management-dashboard && npm run dev -- --host 0.0.0.0');
console.log('Login: superadmin@cblapp.com / Admin@123!');
console.log(`DB file: ${sqlitePath}`);
