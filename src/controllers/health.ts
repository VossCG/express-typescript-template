import type { RequestHandler } from 'express';
import { sendSuccess } from '../core/ApiResponse';

export interface HealthController {
  check: RequestHandler;
}

export const healthController: HealthController = {
  check: (_req, res) => {
    sendSuccess(res, {
      status: 'ok' as const,
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    });
  },
};
