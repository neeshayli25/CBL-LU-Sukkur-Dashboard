'use strict';

/**
 * Programmatic seeder runner (Umzug).
 * Canonical alternative: npx sequelize-cli db:seed:all
 *
 * Seeders are NOT fully idempotent — re-running after a successful seed
 * may fail with duplicate-key validation errors. That is safe if data
 * already exists (superadmin@cblapp.com / Admin@123!).
 */

require('dotenv').config();

const path = require('path');
const { Umzug, SequelizeStorage } = require('umzug');
const { sequelize } = require('../src/database/connection');
const logger = require('../src/shared/utils/logger');

const runSeeders = async () => {
  try {
    logger.info('Running database seeders...');
    await sequelize.authenticate();

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
      logger,
    });

    const seeders = await umzug.up();
    logger.info(`Applied ${seeders.length} seeder(s)`);
    process.exit(0);
  } catch (err) {
    logger.error('Seeding failed:', err);
    process.exit(1);
  }
};

runSeeders();
