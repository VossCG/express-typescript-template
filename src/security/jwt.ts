import { randomUUID } from 'node:crypto';

import jwt, { type JwtPayload } from 'jsonwebtoken';

import { UnauthorizedError } from '../core/ApiError';
import type {
  AccessTokenClaims,
  AuthTokenService,
  RefreshTokenClaims,
} from '../services/auth';

const ALGORITHM = 'HS256' as const;

interface AuthJwtPayload extends JwtPayload {
  token_use?: unknown;
  sid?: unknown;
}

export interface AuthTokenServiceConfig {
  secret: string;
  issuer: string;
  audience: string;
  accessTokenTtlSeconds: number;
  generateId?: () => string;
}

const readClaims = (
  decoded: string | JwtPayload,
  expectedUse: 'access' | 'refresh',
): AccessTokenClaims | RefreshTokenClaims => {
  if (typeof decoded === 'string') {
    throw new Error('JWT payload must be an object');
  }

  const payload = decoded as AuthJwtPayload;
  if (
    payload.token_use !== expectedUse ||
    typeof payload.sub !== 'string' ||
    typeof payload.sid !== 'string' ||
    typeof payload.jti !== 'string'
  ) {
    throw new Error('Required JWT claims are missing');
  }

  return {
    userId: payload.sub,
    sessionId: payload.sid,
    tokenId: payload.jti,
  };
};

export const createAuthTokenService = (
  config: AuthTokenServiceConfig,
): AuthTokenService => {
  const { secret, issuer, audience, accessTokenTtlSeconds } = config;
  const generateId = config.generateId ?? randomUUID;

  if (secret.length < 32) {
    throw new Error('JWT secret must contain at least 32 characters');
  }
  if (!Number.isInteger(accessTokenTtlSeconds) || accessTokenTtlSeconds <= 0) {
    throw new Error('Access token TTL must be a positive integer');
  }

  const verify = (
    token: string,
    expectedUse: 'access' | 'refresh',
  ): AccessTokenClaims | RefreshTokenClaims => {
    try {
      const decoded = jwt.verify(token, secret, {
        algorithms: [ALGORITHM],
        issuer,
        audience,
      });
      return readClaims(decoded, expectedUse);
    } catch {
      throw new UnauthorizedError(`Invalid ${expectedUse} token`);
    }
  };

  return {
    issueTokenPair: async (input) => {
      const commonOptions = {
        algorithm: ALGORITHM,
        issuer,
        audience,
        subject: input.userId,
      };

      const accessToken = jwt.sign(
        { token_use: 'access', sid: input.sessionId },
        secret,
        {
          ...commonOptions,
          jwtid: generateId(),
          expiresIn: accessTokenTtlSeconds,
        },
      );
      const refreshToken = jwt.sign(
        {
          token_use: 'refresh',
          sid: input.sessionId,
          exp: Math.floor(input.refreshExpiresAt.getTime() / 1000),
        },
        secret,
        {
          ...commonOptions,
          jwtid: input.refreshTokenId,
        },
      );

      return { accessToken, refreshToken };
    },

    verifyAccessToken: async (token) =>
      verify(token, 'access') as AccessTokenClaims,

    verifyRefreshToken: async (token) =>
      verify(token, 'refresh') as RefreshTokenClaims,
  };
};
