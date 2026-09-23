import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const isHttpOrigin = (value: string): boolean => {
  try {
    const url = new URL(value);
    return ['http:', 'https:'].includes(url.protocol) && url.origin === value;
  } catch {
    return false;
  }
};

const envSchema = z
  .object({
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
    PORT: z.coerce.number().int().positive().default(3000),
    CORS_ORIGIN: z.string().default('*'),
    DATABASE_URL: z.string().url(),
  })
  .superRefine((values, context) => {
    if (
      values.CORS_ORIGIN !== '*' &&
      values.CORS_ORIGIN !== 'none' &&
      !isHttpOrigin(values.CORS_ORIGIN)
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['CORS_ORIGIN'],
        message: 'Use an HTTP origin such as https://app.example.com, or none',
      });
    }

    if (values.NODE_ENV === 'production' && values.CORS_ORIGIN === '*') {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['CORS_ORIGIN'],
        message: 'Set a specific origin or none in production',
      });
    }
  });

export const parseEnv = (values: NodeJS.ProcessEnv) => {
  const result = envSchema.safeParse(values);

  if (!result.success) {
    const issues = result.error.issues
      .map((issue) => `${issue.path.join('.')}: ${issue.message}`)
      .join(', ');
    throw new Error(`Invalid environment variables: ${issues}`);
  }

  return result.data;
};

export const env = parseEnv(process.env);
