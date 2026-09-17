import { Router } from 'express';
import { z } from 'zod';

import { registry, successResponseSchema } from '../../config/openapi';
import { sendSuccess } from '../../core/ApiResponse';

const router = Router();

const healthSchema = z.object({
  status: z.literal('ok'),
  timestamp: z.string().datetime(),
  uptime: z.number().nonnegative(),
});

registry.registerPath({
  method: 'get',
  path: '/health',
  tags: ['Health'],
  summary: 'Check API health',
  responses: {
    200: {
      description: 'API is running',
      content: {
        'application/json': { schema: successResponseSchema(healthSchema) },
      },
    },
  },
});

router.get('/', (_req, res) => {
  return sendSuccess(res, {
    status: 'ok' as const,
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

export default router;
