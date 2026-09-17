import http from 'node:http';

import app from './app';
import { env } from './config/env';
import {
  checkDatabaseConnection,
  closeDatabaseConnection,
} from './database';
import logger from './core/logger';

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

    server.close(async () => {
      await closeDatabaseConnection();
      process.exit(0);
    });
  };

  process.on('SIGINT', () => void shutdown('SIGINT'));
  process.on('SIGTERM', () => void shutdown('SIGTERM'));
};

start().catch((err) => {
  logger.fatal({ err }, 'Application startup failed');
  process.exit(1);
});
