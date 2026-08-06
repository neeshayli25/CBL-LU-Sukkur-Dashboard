#!/usr/bin/env node
'use strict';

/**
 * Import plant Excel log sheets directly into the configured database.
 * No running API required — uses logSheetService + Sequelize.
 *
 * Usage (from repo root or backend/):
 *   node backend/scripts/import-plant-data.js [--force] [--imports-dir ../data/imports]
 */

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');

const rootDir = path.join(__dirname, '..', '..');
const defaultImports = path.join(rootDir, 'data', 'imports');

const importsArg = process.argv.includes('--imports-dir')
  ? process.argv[process.argv.indexOf('--imports-dir') + 1]
  : process.env.IMPORTS_DIR || defaultImports;

const force = process.argv.includes('--force') || process.env.IMPORT_FORCE === 'true';

const JOBS = [
  {
    module: 'hazard-reporting',
    file: 'Hazard_Log_Sheet_YTD-June-2026_ab87.xlsx',
    sheetName: 'Hazard Spotting 2026',
    headerRowIndex: 1,
  },
  {
    module: 'near-miss',
    file: 'Hazard_Log_Sheet_YTD-June-2026_ab87.xlsx',
    sheetName: 'Near Miss',
    headerRowIndex: 1,
  },
  {
    module: 'action-tracker',
    file: 'Action_Tracker-_June__-_26_-_Copy_5e9c.xlsx',
    sheetName: 'EHS Tracker',
    headerRowIndex: 1,
  },
  {
    module: 'training-records',
    file: 'Departmental_Training_Log_YTD-June-2026_9bdb.xlsx',
    sheets: ['January', 'February', 'March', 'April', 'MAY', 'June'],
    headerRowIndex: 0,
  },
  {
    module: 'critical-audit-plan',
    file: 'DCS_Required_For_PRJ_6262.xlsx',
    sheetName: 'Critical Audit Plan',
    headerRowIndex: 1,
  },
  {
    module: 'incident-log',
    file: 'Incident_Log_YTD-June-26_6a83.xlsx',
    sheetName: 'Incidents Log YTD-JAN-2026',
    headerRowIndex: 0,
  },
];

async function main() {
  const importsDir = path.resolve(importsArg);
  if (!fs.existsSync(importsDir)) {
    console.error(`Imports folder not found: ${importsDir}`);
    process.exit(1);
  }

  const { sequelize } = require('../src/database/connection');
  const logSheetService = require('../src/modules/log-sheets/log-sheet.service');
  const HseLogRecord = require('../src/modules/log-sheets/hse-log-record.model');
  const User = require('../src/modules/users/user.model');
  const admin = await User.findOne({ where: { email: 'superadmin@cblapp.com' } });
  if (!admin) {
    console.error('superadmin@cblapp.com not found — run migrate + seed first.');
    process.exit(1);
  }

  const existing = await HseLogRecord.count();
  if (existing > 0 && !force) {
    console.log(`Skipping import — ${existing} log records already exist. Use --force to re-import.`);
    await sequelize.close();
    return;
  }

  if (force && existing > 0) {
    console.log(`Clearing ${existing} existing log records...`);
    await HseLogRecord.destroy({ where: {}, force: true });
  }

  let totalImported = 0;

  for (const job of JOBS) {
    const filePath = path.join(importsDir, job.file);
    if (!fs.existsSync(filePath)) {
      console.warn(`Skip missing: ${job.file}`);
      continue;
    }

    const wb = XLSX.readFile(filePath, { cellDates: true });
    const sheets = job.sheets || [job.sheetName || wb.SheetNames[0]];

    for (const sheetName of sheets) {
      if (!wb.SheetNames.includes(sheetName)) {
        console.warn(`Skip missing sheet "${sheetName}" in ${job.file}`);
        continue;
      }

      const sheet = wb.Sheets[sheetName];
      const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '', raw: false });
      const parsed = logSheetService.parseSheetRows(job.module, rows, {
        headerRowIndex: job.headerRowIndex ?? 0,
      });

      const toInsert = parsed.records.filter(
        (r) => !r._validation_errors || r._validation_errors.length === 0,
      );

      const bulk = await logSheetService.bulkCreate(job.module, toInsert, admin.id);
      totalImported += bulk.created;
      console.log(
        `OK  ${job.module}/${sheetName}: imported=${bulk.created} of ${parsed.record_count}` +
          ` errors=${parsed.validation_errors.length}`,
      );
    }
  }

  console.log(`\nDone. Total imported: ${totalImported}`);
  await sequelize.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
