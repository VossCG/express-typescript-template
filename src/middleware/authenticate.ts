import type { RequestHandler, Response } from 'express';

import { UnauthorizedError } from '../core/ApiError';
import type { AuthTokenService } from '../services/auth';

export interface AuthContext {
  userId: string;
  sessionId: string;
}

export const createAuthenticate = (
  tokenService: AuthTokenService,
): RequestHandler => async (req, res, next) => {
  try {
    const authorization = req.get('authorization');
    const match = authorization?.match(/^Bearer\s+(\S+)$/i);
    if (!match) {
      throw new UnauthorizedError('Bearer access token is required');
    }

    const claims = await tokenService.verifyAccessToken(match[1]);
    res.locals.auth = {
      userId: claims.userId,
      sessionId: claims.sessionId,
    } satisfies AuthContext;
    next();
  } catch (error) {
    next(error);
  }
};

export const getAuthContext = (res: Response): AuthContext =>
  res.locals.auth as AuthContext;
