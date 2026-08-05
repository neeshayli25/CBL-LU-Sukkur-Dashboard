#!/usr/bin/env node
'use strict';

/**
 * Import CBL Sukkur Incident Log workbook into /api/v1/log-sheets/incident-log
 *
 * Usage:
 *   node scripts/import-incident-log.js
 */

const fs = require('fs');
const path = require('path');

const BASE = process.env.API_BASE || 'http://localhost:5000/api/v1';
const EMAIL = process.env.IMPORT_EMAIL || 'superadmin@cblapp.com';
const PASSWORD = process.env.IMPORT_PASSWORD || 'Admin@123!';
const FILE = process.argv[2]
  || '/home/ubuntu/.cursor/projects/workspace/uploads/Incident_Log_YTD-June-26_6a83.xlsx';

const JOBS = [
  { sheetName: 'Incidents Log YTD-JAN-2026', headerRowIndex: 0, label: '2026 YTD' },
  { sheetName: 'Incident Log 2025', headerRowIndex: 0, label: '2025 archive' },
];

async function login() {
  const res = await fetch(`${BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: EMAIL, password: PASSWORD }),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(`Login failed: ${JSON.stringify(json)}`);
  const token = json.data?.tokens?.accessToken || json.data?.accessToken;
  if (!token) throw new Error('No access token');
  return token;
}

async function importSheet(token, sheetName, headerRowIndex) {
  const form = new FormData();
  form.append('file', new Blob([fs.readFileSync(FILE)]), path.basename(FILE));
  form.append('sheetName', sheetName);
  form.append('headerRowIndex', String(headerRowIndex));
  form.append('force', 'false');

  const res = await fetch(`${BASE}/log-sheets/incident-log/import`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: form,
  });
  const json = await res.json();
  if (!res.ok) {
    console.error(`FAIL ${sheetName}:`, json.message || json);
    return null;
  }
  console.log(
    `OK  ${sheetName}: imported=${json.data?.imported} of ${json.data?.record_count}`
      + ` errors=${json.data?.validation_errors?.length || 0}`
      + ` warnings=${json.data?.warnings?.length || 0}`,
  );
  if (json.data?.records?.[0]) {
    const s = json.data.records[0];
    console.log('   sample:', {
      date: s.date,
      dept: s.department_id,
      cat: s.incident_category_id,
      status: s.status_id,
      actions: String(s.action_items || '').split('\n').length,
    });
  }
  return json;
}

async function main() {
  if (!fs.existsSync(FILE)) {
    console.error('File not found:', FILE);
    process.exit(1);
  }
  console.log(`Logging in to ${BASE}...`);
  const token = await login();

  // Clear previous incident-log rows so re-import is clean
  const list = await fetch(`${BASE}/log-sheets/incident-log?limit=5000`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const existing = await list.json();
  const rows = existing.data || [];
  console.log(`Clearing ${rows.length} existing incident-log rows...`);
  for (const row of rows) {
    await fetch(`${BASE}/log-sheets/incident-log/${row.id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
  }

  for (const job of JOBS) {
    await importSheet(token, job.sheetName, job.headerRowIndex);
  }

  const after = await fetch(`${BASE}/log-sheets/incident-log?limit=5000`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const body = await after.json();
  const data = body.data || [];
  const byCat = {};
  data.forEach((r) => {
    const c = r.incident_category_id || 'Unknown';
    byCat[c] = (byCat[c] || 0) + 1;
  });
  console.log('Total incident-log records:', data.length);
  console.log('By category:', byCat);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
