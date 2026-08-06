'use strict';

require('dotenv').config();

const http = require('http');
const app = require('./src/app');
const { sequelize } = require('./src/database/connection');
const logger = require('./src/shared/utils/logger');
const config = require('./src/database/config');

const PORT = config.port || 5000;
const server = http.createServer(app);

// ─── Socket.IO ───────────────────────────────────────────────────────────────
const { initSockets } = require('./src/core/sockets');
initSockets(server);

// ─── Cron Jobs ───────────────────────────────────────────────────────────────
const { initCron } = require('./src/core/cron/scheduler');

// ─── Graceful Shutdown ───────────────────────────────────────────────────────
const shutdown = async (signal) => {
  logger.info(`${signal} received — shutting down gracefully`);
  server.close(async () => {
    try {
      await sequelize.close();
      logger.info('MySQL connection pool closed');
      process.exit(0);
    } catch (err) {
      logger.error('Error during shutdown', err);
      process.exit(1);
    }
  });
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
process.on('uncaughtException', (err) => {
  logger.error('Uncaught Exception:', err);
  process.exit(1);
});
process.on('unhandledRejection', (reason) => {
  logger.error('Unhandled Rejection:', reason);
  process.exit(1);
});

// ─── Bootstrap ───────────────────────────────────────────────────────────────
const bootstrap = async () => {
  try {
    await sequelize.authenticate();
    logger.info(`✅ Database connected (${process.env.DB_DIALECT || 'mysql'})`);

    server.listen(PORT, '0.0.0.0', () => {
      logger.info(`🚀 Server running on port ${PORT} [${config.env}]`);
      logger.info(`📖 API Docs: http://localhost:${PORT}/api/docs`);
      logger.info(`❤️  Health:  http://localhost:${PORT}/api/health`);
    });

    initCron();
    logger.info('⏰ Cron jobs initialized');
  } catch (err) {
    logger.error('❌ Failed to start server:', err);
    if (err?.name === 'SequelizeAccessDeniedError' || /Access denied for user/i.test(String(err?.message || ''))) {
      logger.error('');
      logger.error('────────────────────────────────────────────────────────');
      logger.error('Database rejected credentials from backend/.env');
      logger.error('Recommended (no MySQL Workbench / Docker needed):');
      logger.error('  From repo root:');
      logger.error('    node backend/scripts/setup-embedded.js');
      logger.error('  Or PowerShell:');
      logger.error('    powershell -ExecutionPolicy Bypass -File .\\backend\\scripts\\setup-embedded.ps1');
      logger.error('That creates backend/data/cbl.sqlite inside the project.');
      logger.error('See WINDOWS_SETUP.md');
      logger.error('────────────────────────────────────────────────────────');
    }
    process.exit(1);
  }
};

bootstrap();
