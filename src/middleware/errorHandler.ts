import type { ErrorRequestHandler, RequestHandler } from 'express';

import { env } from '../config/env';
import { ApiError, NotFoundError } from '../core/ApiError';
import logger from '../core/logger';
import { TaskNotFoundError } from '../domain/task';

export const notFound: RequestHandler = (req, _res, next) => {
  next(new NotFoundError(`Route ${req.method} ${req.originalUrl} not found`));
};

export const error: ErrorRequestHandler = (err, req, res, _next) => {
  if (err instanceof SyntaxError && 'status' in err && err.status === 400) {
    res.status(400).json({
      success: false,
      error: {
        code: 'BAD_REQUEST',
        message: 'Malformed JSON request body',
      },
    });
    return;
  }

  const apiError = err instanceof TaskNotFoundError ? new NotFoundError(err.message) : err;

  if (apiError instanceof ApiError) {
    if (apiError.status >= 500) {
      logger.error({ err: apiError, method: req.method, path: req.originalUrl });
    }

    res.status(apiError.status).json({
      success: false,
      error: {
        code: apiError.code,
        message: apiError.message,
        ...(apiError.details === undefined ? {} : { details: apiError.details }),
      },
    });
    return;
  }

  logger.error({ err, method: req.method, path: req.originalUrl });
  res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message:
        env.NODE_ENV === 'production'
          ? 'An unexpected error occurred'
          : err instanceof Error
            ? err.message
            : 'An unexpected error occurred',
    },
  });
};
