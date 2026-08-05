#!/usr/bin/env node
'use strict';

/**
 * Import plant Excel log sheets into /api/v1/log-sheets/:module
 *
 * Usage:
 *   node scripts/import-log-sheets.js [--base http://localhost:5000/api/v1] [--email ...] [--password ...]
 */

const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');

const BASE = process.argv.includes('--base')
  ? process.argv[process.argv.indexOf('--base') + 1]
  : process.env.API_BASE || 'http://localhost:5000/api/v1';
const EMAIL = process.env.IMPORT_EMAIL || 'superadmin@cblapp.com';
const PASSWORD = process.env.IMPORT_PASSWORD || 'Admin@123!';

const UPLOADS = '/home/ubuntu/.cursor/projects/workspace/uploads';

const JOBS = [
  {
    module: 'hazard-reporting',
    file: path.join(UPLOADS, 'Hazard_Log_Sheet_YTD-June-2026_ab87.xlsx'),
    sheetName: 'Hazard Spotting 2026',
    headerRowIndex: 1,
  },
  {
    module: 'near-miss',
    file: path.join(UPLOADS, 'Hazard_Log_Sheet_YTD-June-2026_ab87.xlsx'),
    sheetName: 'Near Miss',
    headerRowIndex: 1,
  },
  {
    module: 'action-tracker',
    file: path.join(UPLOADS, 'Action_Tracker-_June__-_26_-_Copy_5e9c.xlsx'),
    sheetName: 'EHS Tracker',
    headerRowIndex: 1,
  },
  {
    module: 'training-records',
    file: path.join(UPLOADS, 'Departmental_Training_Log_YTD-June-2026_9bdb.xlsx'),
    sheets: ['January', 'February', 'March', 'April', 'MAY', 'June'],
    headerRowIndex: 0,
  },
  {
    module: 'critical-audit-plan',
    file: path.join(UPLOADS, 'DCS_Required_For_PRJ_6262.xlsx'),
    sheetName: 'Critical Audit Plan',
    headerRowIndex: 1,
  },
];

async function login() {
  const res = await fetch(`${BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: EMAIL, password: PASSWORD }),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(`Login failed: ${JSON.stringify(json)}`);
  const token = json.data?.tokens?.accessToken || json.data?.accessToken || json.accessToken;
  if (!token) throw new Error(`No access token in login response: ${JSON.stringify(json)}`);
  return token;
}

async function importFile(token, job, sheetName) {
  const form = new FormData();
  const buf = fs.readFileSync(job.file);
  form.append('file', new Blob([buf]), path.basename(job.file));
  form.append('sheetName', sheetName);
  form.append('headerRowIndex', String(job.headerRowIndex ?? 0));
  form.append('force', 'false');

  const res = await fetch(`${BASE}/log-sheets/${job.module}/import`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: form,
  });
  const json = await res.json();
  if (!res.ok) {
    console.error(`FAIL ${job.module}/${sheetName}:`, json.message || json);
    return null;
  }
  console.log(
    `OK  ${job.module}/${sheetName}: imported=${json.data?.imported} of ${json.data?.record_count}` +
      ` errors=${json.data?.validation_errors?.length || 0}` +
      ` warnings=${json.data?.warnings?.length || 0}`
  );
  return json;
}

async function main() {
  console.log(`Logging in to ${BASE} as ${EMAIL}...`);
  const token = await login();
  console.log('Authenticated.');

  for (const job of JOBS) {
    if (!fs.existsSync(job.file)) {
      console.warn(`Skip missing file: ${job.file}`);
      continue;
    }
    const wb = XLSX.readFile(job.file, { cellDates: true });
    const sheets = job.sheets || [job.sheetName || wb.SheetNames[0]];
    for (const sheet of sheets) {
      if (!wb.SheetNames.includes(sheet)) {
        console.warn(`Skip missing sheet ${sheet} in ${path.basename(job.file)}`);
        continue;
      }
      await importFile(token, job, sheet);
    }
  }
  console.log('Done.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
