import type { RequestHandler } from 'express';

import { UnauthorizedError } from '../core/ApiError';
import { sendSuccess } from '../core/ApiResponse';
import { toAuthUserResponse } from '../mappers/auth';
import { getAuthContext } from '../middleware/authenticate';
import type { GoogleLoginInput } from '../schemas/auth';
import {
  clearRefreshTokenCookie,
  getRefreshTokenCookie,
  setRefreshTokenCookie,
  type RefreshCookieConfig,
} from '../security/authCookie';
import type { AuthService } from '../services/auth';

export interface AuthController {
  googleLogin: RequestHandler;
  refresh: RequestHandler;
  logout: RequestHandler;
  logoutAll: RequestHandler;
  me: RequestHandler;
}

export interface AuthControllerDependencies {
  service: AuthService;
  refreshCookie: RefreshCookieConfig;
}

export const createAuthController = ({
  service,
  refreshCookie,
}: AuthControllerDependencies): AuthController => ({
  googleLogin: async (req, res) => {
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
  },

  refresh: async (req, res) => {
    const refreshToken = getRefreshTokenCookie(req, refreshCookie);
    if (!refreshToken) {
      throw new UnauthorizedError('Refresh token cookie is required');
    }

    const tokens = await service.refresh(refreshToken);
    setRefreshTokenCookie(res, tokens.refreshToken, refreshCookie);
    sendSuccess(res, { accessToken: tokens.accessToken });
  },

  logout: async (req, res) => {
    const refreshToken = getRefreshTokenCookie(req, refreshCookie);
    try {
      if (refreshToken) await service.logout(refreshToken);
    } finally {
      clearRefreshTokenCookie(res, refreshCookie);
    }
    res.status(204).send();
  },

  logoutAll: async (_req, res) => {
    const { userId } = getAuthContext(res);
    const revokedSessions = await service.logoutAll(userId);
    clearRefreshTokenCookie(res, refreshCookie);
    sendSuccess(res, { revokedSessions });
  },

  me: async (_req, res) => {
    const { userId } = getAuthContext(res);
    const user = await service.getCurrentUser(userId);
    sendSuccess(res, toAuthUserResponse(user));
  },
});
