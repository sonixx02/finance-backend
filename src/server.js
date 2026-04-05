const app = require('./app');
const env = require('./config/env');
const logger = require('./config/logger');
const { closePool } = require('./config/db');

const server = app.listen(env.port, () => {
  logger.info(`Finance backend listening on port ${env.port}.`);
});

async function shutdown(signal) {
  logger.info(`${signal} received. Closing HTTP server.`);

  server.close(async () => {
    try {
      await closePool();
      logger.info('HTTP server and database pool closed.');
      process.exit(0);
    } catch (error) {
      logger.error('Error during shutdown.', error.message);
      process.exit(1);
    }
  });
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('unhandledRejection', (error) => {
  logger.error('Unhandled promise rejection.', error.message);
});
process.on('uncaughtException', (error) => {
  logger.error('Uncaught exception.', error.message);
});

module.exports = server;
