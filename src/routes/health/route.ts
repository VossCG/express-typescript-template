import { Router } from 'express';

import { sendSuccess } from '../../core/ApiResponse';
import { route } from '../../helpers/routeDecorator';
import { healthSchema } from './schema';

const router = Router();

route({
  method: 'get',
  path: '/health',
  tags: ['Health'],
  summary: 'Check API health',
  responseSchema: healthSchema,
  responseDescription: 'API is running',
});

router.get('/', (_req, res) => {
  return sendSuccess(res, {
    status: 'ok' as const,
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

export default router;
