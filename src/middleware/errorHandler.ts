import { ErrorRequestHandler, RequestHandler } from 'express';

import { env } from '../config/env';
import { ApiError, NotFoundError } from '../core/ApiError';
import logger from '../core/logger';

export const notFoundHandler: RequestHandler = (req, _res, next) => {
  next(new NotFoundError(`Route ${req.method} ${req.originalUrl} not found`));
};

export const errorHandler: ErrorRequestHandler = (err, req, res, _next) => {
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

  if (err instanceof ApiError) {
    if (err.status >= 500) {
      logger.error({ err, method: req.method, path: req.originalUrl });
    }

    res.status(err.status).json({
      success: false,
      error: {
        code: err.code,
        message: err.message,
        ...(err.details === undefined ? {} : { details: err.details }),
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
