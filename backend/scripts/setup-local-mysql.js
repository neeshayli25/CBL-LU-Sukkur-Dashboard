'use strict';

/**
 * Localhost MySQL setup — Windows service (3306) or Docker (3307).
 * Tests connection, creates DB, migrates, seeds, imports plant Excel data.
 *
 * From repo root:
 *   node backend/scripts/setup-local-mysql.js
 *   node backend/scripts/setup-local-mysql.js --port 3307
 */

const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
const { spawnSync } = require('child_process');

const backendDir = path.join(__dirname, '..');
const rootDir = path.join(backendDir, '..');

function arg(name, fallback) {
  const idx = process.argv.indexOf(`--${name}`);
  if (idx !== -1 && process.argv[idx + 1]) return process.argv[idx + 1];
  return fallback;
}

const DB_HOST = arg('host', '127.0.0.1');
const DB_PORT = Number(arg('port', process.env.LOCAL_DB_PORT || 3306));
const DB_NAME = arg('name', 'cbl_db');
const DB_USER = arg('user', 'root');
const DB_PASSWORD = arg('password', 'secret');
const skipImport = process.argv.includes('--skip-import');

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

async function testAndCreateDb() {
  console.log(`Testing MySQL ${DB_USER}@${DB_HOST}:${DB_PORT} ...`);
  let conn;
  try {
    conn = await mysql.createConnection({
      host: DB_HOST,
      port: DB_PORT,
      user: DB_USER,
      password: DB_PASSWORD,
      connectTimeout: 10000,
    });
  } catch (err) {
    console.error('\nMySQL connection failed:', err.message);
    console.error('\n--- How to fix ---');
    if (DB_PORT === 3306) {
      console.error('Windows MySQL (port 3306):');
      console.error('  Start-Service MySQL80_New');
      console.error('  Set root password to "secret":');
      console.error('    mysql -u root -p -e "ALTER USER \'root\'@\'localhost\' IDENTIFIED BY \'secret\';"');
    } else {
      console.error('Docker MySQL (port 3307):');
      console.error('  docker compose -f docker-compose.db.yml up -d');
      console.error('  docker logs cbl-mysql');
    }
    console.error('\nOr re-run with Docker port:');
    console.error('  node backend/scripts/setup-local-mysql.js --port 3307');
    throw err;
  }

  await conn.query(`CREATE DATABASE IF NOT EXISTS \`${DB_NAME}\``);
  console.log(`OK  Database "${DB_NAME}" ready`);
  await conn.end();
}

console.log('Installing backend dependencies (mysql2)...');
run('npm', ['install', '--no-fund', '--no-audit'], backendDir);

(async () => {
  await testAndCreateDb();

  const backendEnv = `NODE_ENV=development
PORT=5000
APP_NAME=CBL-Backend
APP_URL=http://localhost:5000
CLIENT_URL=http://localhost:5173

DB_DIALECT=mysql
DB_HOST=${DB_HOST}
DB_PORT=${DB_PORT}
DB_NAME=${DB_NAME}
DB_USER=${DB_USER}
DB_PASSWORD=${DB_PASSWORD}
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
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173,http://localhost:5174,http://127.0.0.1:5173,http://127.0.0.1:5174
ENCRYPTION_KEY=cbl_local_encryption_key_32char!
`;

  fs.writeFileSync(path.join(backendDir, '.env'), backendEnv, 'utf8');
  console.log(`Wrote backend/.env (MySQL ${DB_HOST}:${DB_PORT} / ${DB_NAME})`);

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

  if (!skipImport) {
    console.log('Importing plant Excel data from data/imports/ ...');
    try {
      run('node', ['scripts/import-plant-data.js'], backendDir);
    } catch (err) {
      console.warn('Plant import skipped or partial:', err.message);
    }
  }

  console.log('\nLocalhost MySQL setup complete.');
  console.log(`  DB: ${DB_HOST}:${DB_PORT}/${DB_NAME}  user=${DB_USER}  password=${DB_PASSWORD}`);
  console.log('  Backend:  cd backend && npm run dev');
  console.log('  Frontend: cd apps/management-dashboard && npm run dev');
  console.log('  Login:    superadmin@cblapp.com / Admin@123!');
})().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
