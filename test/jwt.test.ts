import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { UnauthorizedError } from '../src/core/ApiError';
import { createAuthTokenService } from '../src/security/jwt';

const secret = 'test-secret-that-is-longer-than-thirty-two-characters';
const userId = 'd8ebd1b0-a2c1-4d76-a9a1-1c3e56e031c9';
const sessionId = 'd504665d-a819-4895-b9bc-397591598f5e';
const refreshTokenId = '8d8af960-3dd4-40a9-b962-3905c67cf50d';

const createService = () =>
  createAuthTokenService({
    secret,
    issuer: 'test-issuer',
    audience: 'test-audience',
    accessTokenTtlSeconds: 600,
    generateId: () => 'access-token-id',
  });

describe('AuthTokenService', () => {
  it('issues and verifies typed access and refresh tokens', async () => {
    const service = createService();
    const tokens = await service.issueTokenPair({
      userId,
      sessionId,
      refreshTokenId,
      refreshExpiresAt: new Date(Date.now() + 60_000),
    });

    assert.deepEqual(await service.verifyAccessToken(tokens.accessToken), {
      userId,
      sessionId,
      tokenId: 'access-token-id',
    });
    assert.deepEqual(await service.verifyRefreshToken(tokens.refreshToken), {
      userId,
      sessionId,
      tokenId: refreshTokenId,
    });
  });

  it('rejects malformed tokens and the wrong token type', async () => {
    const service = createService();
    const tokens = await service.issueTokenPair({
      userId,
      sessionId,
      refreshTokenId,
      refreshExpiresAt: new Date(Date.now() + 60_000),
    });

    await assert.rejects(
      service.verifyAccessToken('not-a-jwt'),
      UnauthorizedError,
    );
    await assert.rejects(
      service.verifyRefreshToken(tokens.accessToken),
      UnauthorizedError,
    );
  });
});
