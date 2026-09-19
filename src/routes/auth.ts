import { Router, type RequestHandler } from 'express';

import { UnauthorizedError } from '../core/ApiError';
import { sendSuccess } from '../core/ApiResponse';
import { route } from '../helpers/routeDecorator';
import { validate } from '../helpers/validator';
import { toAuthUserResponse } from '../mappers/auth';
import { getAuthContext } from '../middleware/authenticate';
import {
  authUserSchema,
  googleLoginSchema,
  loginResponseSchema,
  logoutAllResponseSchema,
  refreshResponseSchema,
  type GoogleLoginInput,
} from '../schemas/auth';
import {
  clearRefreshTokenCookie,
  getRefreshTokenCookie,
  setRefreshTokenCookie,
  type RefreshCookieConfig,
} from '../security/authCookie';
import type { AuthService } from '../services/auth';

route({
  method: 'post',
  path: '/api/v1/auth/google',
  tags: ['Auth'],
  summary: 'Sign in with Google',
  description:
    'Verifies a Google ID token, creates or updates the local user, and starts a session. The refresh token is returned as an HttpOnly cookie.',
  requestSchema: googleLoginSchema,
  responseSchema: loginResponseSchema,
  errorStatuses: [400, 401, 403, 409, 500],
});

route({
  method: 'post',
  path: '/api/v1/auth/refresh',
  tags: ['Auth'],
  summary: 'Refresh the access token',
  description:
    'Rotates the refresh token from the HttpOnly cookie and returns a new access token.',
  responseSchema: refreshResponseSchema,
  errorStatuses: [401, 403, 500],
});

route({
  method: 'post',
  path: '/api/v1/auth/logout',
  tags: ['Auth'],
  summary: 'Sign out of the current session',
  responseStatus: 204,
  errorStatuses: [401, 500],
});

route({
  method: 'post',
  path: '/api/v1/auth/logout-all',
  tags: ['Auth'],
  summary: 'Sign out of all sessions',
  security: [{ bearerAuth: [] }],
  responseSchema: logoutAllResponseSchema,
  errorStatuses: [401, 500],
});

route({
  method: 'get',
  path: '/api/v1/auth/me',
  tags: ['Auth'],
  summary: 'Get the current user',
  security: [{ bearerAuth: [] }],
  responseSchema: authUserSchema,
  errorStatuses: [401, 403, 404, 500],
});

export interface AuthRouterDependencies {
  service: AuthService;
  authenticate: RequestHandler;
  refreshCookie: RefreshCookieConfig;
}

export const createAuthRouter = (
  dependencies: AuthRouterDependencies,
): Router => {
  const { service, authenticate, refreshCookie } = dependencies;
  const router = Router();

  router.post('/google', validate(googleLoginSchema), async (req, res) => {
    const input = req.body as GoogleLoginInput;
    const result = await service.loginWithGoogle({
      idToken: input.idToken,
      userAgent: req.get('user-agent') ?? null,
      ipAddress: req.ip ?? null,
    });

    setRefreshTokenCookie(res, result.tokens.refreshToken, refreshCookie);
    sendSuccess(res, {
      user: toAuthUserResponse(result.user),
      accessToken: result.tokens.accessToken,
    });
  });

  router.post('/refresh', async (req, res) => {
    const refreshToken = getRefreshTokenCookie(req, refreshCookie);
    if (!refreshToken) {
      throw new UnauthorizedError('Refresh token cookie is required');
    }

    const tokens = await service.refresh(refreshToken);
    setRefreshTokenCookie(res, tokens.refreshToken, refreshCookie);
    sendSuccess(res, { accessToken: tokens.accessToken });
  });

  router.post('/logout', async (req, res) => {
    const refreshToken = getRefreshTokenCookie(req, refreshCookie);
    try {
      if (refreshToken) await service.logout(refreshToken);
    } finally {
      clearRefreshTokenCookie(res, refreshCookie);
    }
    res.status(204).send();
  });

  router.post('/logout-all', authenticate, async (_req, res) => {
    const { userId } = getAuthContext(res);
    const revokedSessions = await service.logoutAll(userId);
    clearRefreshTokenCookie(res, refreshCookie);
    sendSuccess(res, { revokedSessions });
  });

  router.get('/me', authenticate, async (_req, res) => {
    const { userId } = getAuthContext(res);
    const user = await service.getCurrentUser(userId);
    sendSuccess(res, toAuthUserResponse(user));
  });

  return router;
};
