import { z } from 'zod';

export const healthSchema = z.object({
  status: z.literal('ok'),
  timestamp: z.string().datetime(),
  uptime: z.number().nonnegative(),
});

export const readinessSchema = z.object({
  status: z.literal('ready'),
});
