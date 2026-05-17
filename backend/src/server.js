const app    = require('./app');
const config = require('./config');
const logger = require('./utils/logger');
const { pool } = require('./config/database');
const { getClient: getRedis } = require('./config/redis');

const start = async () => {
  // ── Test DB connection ─────────────────────────────────────
  try {
    await pool.query('SELECT 1');
    logger.info('PostgreSQL connected');
  } catch (err) {
    logger.error('PostgreSQL connection failed:', err.message);
    logger.warn('Continuing without DB — some features will be unavailable');
  }

  // ── Test Redis connection ──────────────────────────────────
  await getRedis(); // logs its own status

  // ── Start HTTP server ──────────────────────────────────────
  const server = app.listen(config.port, () => {
    logger.info(`MedAI backend running on http://localhost:${config.port}`);
    logger.info(`Environment: ${config.env}`);
  });

  // ── Graceful shutdown ──────────────────────────────────────
  const shutdown = async (signal) => {
    logger.info(`${signal} received — shutting down gracefully`);
    server.close(async () => {
      await pool.end();
      logger.info('Server closed');
      process.exit(0);
    });
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT',  () => shutdown('SIGINT'));
};

start();
