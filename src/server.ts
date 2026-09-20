import http from 'node:http';

import app from './app';
import { env } from './config/env';
import logger from './core/logger';
import { checkDatabaseConnection, closeDatabaseConnection } from './database';

const start = async (): Promise<void> => {
  await checkDatabaseConnection();
  logger.info('Database connection established');

  const server = http.createServer(app);

  server.listen(env.PORT, () => {
    logger.info({ port: env.PORT }, 'API server started');
    logger.info(`API documentation: http://localhost:${env.PORT}/api-docs`);
  });

  server.on('error', (err) => {
    logger.fatal({ err }, 'Failed to start API server');
    process.exitCode = 1;
  });

  let shuttingDown = false;
  const shutdown = async (signal: string): Promise<void> => {
    if (shuttingDown) return;
    shuttingDown = true;
    logger.info({ signal }, 'Shutting down');

    const forceExit = setTimeout(() => {
      logger.error('Forced shutdown after timeout');
      process.exit(1);
    }, 10_000);
    forceExit.unref();

    server.close(async (error) => {
      if (error) {
        logger.error({ err: error }, 'Failed to close API server');
        process.exitCode = 1;
      }
      await closeDatabaseConnection();
      clearTimeout(forceExit);
      process.exit(process.exitCode ?? 0);
    });
  };

  process.on('SIGINT', () => void shutdown('SIGINT'));
  process.on('SIGTERM', () => void shutdown('SIGTERM'));
};

start().catch((err) => {
  logger.fatal({ err }, 'Application startup failed');
  process.exit(1);
});
