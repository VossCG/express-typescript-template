import type { RequestHandler } from 'express';
import { ServiceUnavailableError } from '../core/ApiError';
import { sendSuccess } from '../core/ApiResponse';

export interface HealthController {
  check: RequestHandler;
  ready: RequestHandler;
}

export const createHealthController = (checkDatabase: () => Promise<void>): HealthController => ({
  check: (_req, res) => {
    sendSuccess(res, {
      status: 'ok' as const,
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    });
  },

  ready: async (_req, res) => {
    try {
      await checkDatabase();
    } catch (cause) {
      throw new ServiceUnavailableError('Database unavailable', { cause });
    }

    sendSuccess(res, { status: 'ready' as const });
  },
});
