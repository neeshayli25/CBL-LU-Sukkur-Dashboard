'use strict';

/**
 * Test MySQL connectivity using mysql2 (same driver as the app).
 *
 * Usage:
 *   node scripts/test-db-connection.js
 *   node scripts/test-db-connection.js --host 127.0.0.1 --port 3307 --password secret
 */

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const mysql = require('mysql2/promise');

function arg(name, fallback) {
  const idx = process.argv.indexOf(`--${name}`);
  if (idx !== -1 && process.argv[idx + 1]) return process.argv[idx + 1];
  return process.env[`DB_${name.toUpperCase()}`] || fallback;
}

async function main() {
  const host = arg('host', process.env.DB_HOST || '127.0.0.1');
  const port = Number(arg('port', process.env.DB_PORT || 3306));
  const user = arg('user', process.env.DB_USER || 'root');
  const password = arg('password', process.env.DB_PASSWORD ?? 'secret');
  const database = arg('name', process.env.DB_NAME || 'cbl_db');

  console.log(`Testing MySQL: ${user}@${host}:${port}/${database}`);

  let conn;
  try {
    conn = await mysql.createConnection({
      host,
      port,
      user,
      password,
      connectTimeout: 8000,
    });
    console.log('OK  TCP connection + authentication');
  } catch (err) {
    console.error('FAIL', err.message);
    console.error('');
    console.error('Fix checklist:');
    console.error('  1) MySQL service/container is running');
    console.error('  2) Use host 127.0.0.1 (not localhost) on Windows');
    console.error('  3) Port 3306 = Windows MySQL, 3307 = Docker MySQL');
    console.error('  4) Password matches backend/.env DB_PASSWORD');
    console.error('');
    console.error('Windows quick fix (Docker):');
    console.error('  docker compose -f docker-compose.db.yml up -d');
    console.error('  node backend/scripts/setup-local-mysql.js --port 3307');
    process.exit(1);
  }

  try {
    await conn.query(`CREATE DATABASE IF NOT EXISTS \`${database}\``);
    await conn.changeUser({ database });
    const [rows] = await conn.query('SELECT 1 AS ok');
    console.log('OK  Database exists:', database, rows[0]);
  } finally {
    await conn.end();
  }

  console.log('Database connectivity is good.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
