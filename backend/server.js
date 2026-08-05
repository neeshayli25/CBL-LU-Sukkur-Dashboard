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
    logger.info('✅ MySQL connected successfully');

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
      logger.error('MySQL rejected DB_USER/DB_PASSWORD from backend/.env');
      logger.error('Windows fix (recommended):');
      logger.error('  1) Start Docker Desktop');
      logger.error('  2) From repo root run:');
      logger.error('     powershell -ExecutionPolicy Bypass -File .\\backend\\scripts\\setup-windows.ps1');
      logger.error('  That starts MySQL on port 3307 with password "secret" and writes .env');
      logger.error('See WINDOWS_SETUP.md for details.');
      logger.error('────────────────────────────────────────────────────────');
    }
    process.exit(1);
  }
};

bootstrap();
