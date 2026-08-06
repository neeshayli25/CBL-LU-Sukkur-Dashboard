'use strict';

/**
 * Bootstrap project-local SQLite DB (no MySQL / Workbench / Docker).
 * Creates schema via Sequelize sync, runs seeders, seeds demo log-sheet rows.
 *
 * Usage (from backend/): node scripts/bootstrap-embedded-db.js
 */

require('dotenv').config();

const path = require('path');
const fs = require('fs');
const { Umzug, SequelizeStorage } = require('umzug');

const dataDir = path.join(__dirname, '..', 'data');
fs.mkdirSync(dataDir, { recursive: true });

if (!process.env.DB_DIALECT) process.env.DB_DIALECT = 'sqlite';
if (!process.env.DB_STORAGE) {
  process.env.DB_STORAGE = path.join(dataDir, 'cbl.sqlite');
}

const { sequelize } = require('../src/database/connection');
const logger = require('../src/shared/utils/logger');

async function runSeeders() {
  const umzug = new Umzug({
    migrations: {
      glob: path.join(__dirname, '../src/database/seeders/*.js'),
      resolve: ({ name, path: migrationPath, context }) => {
        // eslint-disable-next-line import/no-dynamic-require, global-require
        const migration = require(migrationPath);
        return {
          name,
          up: async () => migration.up(context, require('sequelize')),
          down: async () => migration.down(context, require('sequelize')),
        };
      },
    },
    context: sequelize.getQueryInterface(),
    storage: new SequelizeStorage({ sequelize, tableName: 'SequelizeData' }),
    logger: console,
  });
  const applied = await umzug.up();
  logger.info(`Seeders applied: ${applied.length}`);
}

async function seedDemoLogSheets() {
  // eslint-disable-next-line global-require
  require('../src/database/models');
  const HseLogRecord = require('../src/modules/log-sheets/hse-log-record.model');
  const existing = await HseLogRecord.count();
  if (existing > 0) {
    logger.info(`hse_log_records already has ${existing} row(s) — skip demo seed`);
    return;
  }

  const { v4: uuidv4 } = require('uuid');
  const batchId = uuidv4();
  const depts = ['Operations', 'Maintenance', 'Engineering', 'HSE', 'Quality', 'Warehouse'];
  const statuses = ['Open', 'WIP', 'Done', 'Closed'];
  const nowYear = '2026';

  const rows = [];

  for (let i = 1; i <= 40; i += 1) {
    const dept = depts[i % depts.length];
    const status = statuses[i % statuses.length];
    const date = `${nowYear}-${String((i % 6) + 1).padStart(2, '0')}-${String((i % 27) + 1).padStart(2, '0')}`;
    rows.push({
      id: uuidv4(),
      module: 'hazard-reporting',
      externalRef: String(i),
      recordDate: date,
      departmentCode: dept,
      statusCode: status,
      categoryCode: i % 2 === 0 ? 'Unsafe Act' : 'Unsafe Condition',
      payload: {
        date,
        department_id: dept,
        status_id: status,
        unsafe_type: i % 2 === 0 ? 'Unsafe Act' : 'Unsafe Condition',
        hazard_description: `Demo hazard #${i} in ${dept}`,
        risk_level: ['Low', 'Medium', 'High'][i % 3],
        reported_by: 'Demo User',
      },
      importBatchId: batchId,
    });
  }

  for (let i = 1; i <= 15; i += 1) {
    const date = `${nowYear}-0${(i % 6) + 1}-${String((i % 27) + 1).padStart(2, '0')}`;
    rows.push({
      id: uuidv4(),
      module: 'near-miss',
      externalRef: String(i),
      recordDate: date,
      departmentCode: depts[i % depts.length],
      statusCode: statuses[i % statuses.length],
      payload: {
        date,
        department_id: depts[i % depts.length],
        status_id: statuses[i % statuses.length],
        description: `Demo near miss #${i}`,
        investigation_required: i % 3 === 0 ? 'Yes' : 'No',
      },
      importBatchId: batchId,
    });
  }

  for (let i = 1; i <= 12; i += 1) {
    const date = `${nowYear}-0${(i % 6) + 1}-${String((i % 27) + 1).padStart(2, '0')}`;
    const category = ['First Aid', 'LTI', 'Near Miss', 'Property Damage'][i % 4];
    rows.push({
      id: uuidv4(),
      module: 'incident-log',
      externalRef: String(i),
      recordDate: date,
      departmentCode: depts[i % depts.length],
      statusCode: i % 2 === 0 ? 'Closed' : 'Open',
      categoryCode: category,
      payload: {
        date,
        department_id: depts[i % depts.length],
        status_id: i % 2 === 0 ? 'Closed' : 'Open',
        incident_category: category,
        description: `Demo incident #${i}`,
      },
      importBatchId: batchId,
    });
  }

  for (let i = 1; i <= 25; i += 1) {
    const date = `${nowYear}-0${(i % 6) + 1}-${String((i % 27) + 1).padStart(2, '0')}`;
    const status = i % 3 === 0 ? 'Done' : 'WIP';
    rows.push({
      id: uuidv4(),
      module: 'action-tracker',
      externalRef: String(i),
      recordDate: date,
      departmentCode: depts[i % depts.length],
      statusCode: status,
      payload: {
        date,
        s_no: String(i),
        department_id: depts[i % depts.length],
        status_id: status,
        actions_recommendation: `Demo CAPA action #${i}`,
        action: `Demo CAPA action #${i}`,
        auditor_name: 'HSE Auditor',
        action_driven_from: 'Hazard',
        audit_description: `Follow-up item ${i}`,
        area_clauses: 'Area A',
        severity: ['Low', 'Medium', 'High'][i % 3],
        responsible_manager: 'Dept Manager',
        target_date: date,
        due_date: date,
        assigned_to: 'Dept Manager',
      },
      importBatchId: batchId,
    });
  }

  for (let i = 1; i <= 20; i += 1) {
    const date = `${nowYear}-0${(i % 6) + 1}-${String((i % 27) + 1).padStart(2, '0')}`;
    const participants = 10 + (i % 20);
    const duration = 30 + (i % 6) * 15;
    rows.push({
      id: uuidv4(),
      module: 'training-records',
      externalRef: String(i),
      recordDate: date,
      departmentCode: depts[i % depts.length],
      statusCode: 'Done',
      payload: {
        date,
        department_id: depts[i % depts.length],
        status_id: 'Done',
        training_type: 'Toolbox Talk',
        trainer: 'HSE Trainer',
        topic: `Demo training topic #${i}`,
        participants,
        duration_minutes: duration,
        manhours: ((participants * duration) / 60).toFixed(2),
      },
      importBatchId: batchId,
    });
  }

  for (let i = 1; i <= 8; i += 1) {
    const date = `${nowYear}-0${(i % 6) + 1}-${String((i % 27) + 1).padStart(2, '0')}`;
    rows.push({
      id: uuidv4(),
      module: 'critical-audit-plan',
      externalRef: String(i),
      recordDate: date,
      departmentCode: depts[i % depts.length],
      statusCode: i % 2 === 0 ? 'Done' : 'WIP',
      payload: {
        date,
        department_id: depts[i % depts.length],
        status_id: i % 2 === 0 ? 'Done' : 'WIP',
        audit_area: `Critical area ${i}`,
        planned_date: date,
      },
      importBatchId: batchId,
    });
  }

  await HseLogRecord.bulkCreate(rows);
  logger.info(`Demo log-sheet rows inserted: ${rows.length}`);
}

async function main() {
  try {
    logger.info(`Embedded DB: dialect=${process.env.DB_DIALECT} storage=${process.env.DB_STORAGE}`);
    await sequelize.authenticate();
    // Load all models before sync
    require('../src/database/models');
    await sequelize.sync();
    logger.info('Schema synced (SQLite file in backend/data/)');
    await runSeeders();
    await seedDemoLogSheets();
    await sequelize.close();
    logger.info('Embedded database ready');
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

main();
