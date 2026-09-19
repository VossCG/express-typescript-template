import dotenv from 'dotenv';

import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(3000),
  CORS_ORIGIN: z.string().default('*'),
  DATABASE_URL: z.string().url(),
  GOOGLE_CLIENT_ID: z.string().min(1),
  JWT_SECRET: z.string().min(32),
  JWT_ISSUER: z.string().min(1).default('backend-template'),
  JWT_AUDIENCE: z.string().min(1).default('backend-template-web'),
  JWT_ACCESS_TTL_SECONDS: z.coerce.number().int().positive().default(600),
  JWT_REFRESH_TTL_SECONDS: z.coerce
    .number()
    .int()
    .positive()
    .default(30 * 24 * 60 * 60),
  REFRESH_COOKIE_NAME: z.string().min(1).default('refresh_token'),
});

const result = envSchema.safeParse(process.env);

if (!result.success) {
  const issues = result.error.issues
    .map((issue) => `${issue.path.join('.')}: ${issue.message}`)
    .join(', ');
  throw new Error(`Invalid environment variables: ${issues}`);
}

export const env = result.data;
