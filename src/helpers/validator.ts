import type { RequestHandler } from 'express';
import type { z } from 'zod';

import { BadRequestError } from '../core/ApiError';

type ValidationSource = 'body' | 'params' | 'query';

export const validate = (
  schema: z.ZodTypeAny,
  source: ValidationSource = 'body',
): RequestHandler => {
  return (req, _res, next) => {
    const result = schema.safeParse(req[source]);

    if (!result.success) {
      return next(new BadRequestError('Request validation failed', result.error.flatten()));
    }

    if (source !== 'query') {
      req[source] = result.data;
    }
    return next();
  };
};
