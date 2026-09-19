import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  ConflictError,
  ForbiddenError,
  UnauthorizedError,
} from '../src/core/ApiError';
import type { GetActiveAuthSessionRow } from '../src/database/sqlc/auth_sessions_sql';
import type { GetUserByIdentityRow } from '../src/database/sqlc/user_identities_sql';
import type { GetUserByIdRow } from '../src/database/sqlc/users_sql';
import type {
  AuthRepositories,
  AuthUnitOfWork,
} from '../src/repositories/authUnitOfWork';
import {
  createAuthService,
  type AuthTokenService,
  type GoogleAuthVerifier,
  type GoogleIdentity,
} from '../src/services/auth';

const now = new Date('2026-09-19T08:00:00.000Z');
const expiresAt = new Date('2026-10-19T08:00:00.000Z');
const userId = '1f547b90-9752-46d2-99f0-b1501518ce4b';
const sessionId = 'e0372753-b846-4b84-a12a-236be03a50c8';
const refreshTokenId = '54aff4e4-a71d-49ec-8d9b-1d9dd587a6a4';
const newRefreshTokenId = '7ea4da57-ff54-442e-9508-8f62b99df53f';

const user: GetUserByIdRow = {
  id: userId,
  email: 'user@example.com',
  displayName: 'Example User',
  avatarUrl: 'https://example.com/avatar.png',
  status: 'active',
  lastLoginAt: now,
  createdAt: now,
  updatedAt: now,
};

const googleIdentity: GoogleIdentity = {
  subject: 'google-subject',
  email: 'user@example.com',
  emailVerified: true,
  displayName: 'Example User',
  avatarUrl: 'https://example.com/avatar.png',
};

const session: GetActiveAuthSessionRow = {
  id: sessionId,
  userId,
  currentRefreshJti: refreshTokenId,
  expiresAt,
  revokedAt: null,
  createdAt: now,
  updatedAt: now,
  lastUsedAt: null,
  userAgent: 'Test Browser',
  ipAddress: '127.0.0.1',
};

const joinedUser: GetUserByIdentityRow = {
  ...user,
  provider: 'google',
  providerSubject: googleIdentity.subject,
  providerEmail: googleIdentity.email,
  emailVerified: true,
};

const createRepositories = (): AuthRepositories => ({
  users: {
    create: async (input) => ({ ...user, ...input }),
    findById: async () => user,
    findByEmail: async () => null,
    updateLoginProfile: async (input) => ({ ...user, ...input, id: input.userId }),
    updateStatus: async (input) => ({ ...user, ...input, id: input.userId }),
  },
  identities: {
    create: async (input) => ({
      ...input,
      createdAt: now,
      updatedAt: now,
    }),
    find: async () => null,
    findUser: async () => null,
    updateProfile: async (input) => ({
      ...input,
      userId,
      createdAt: now,
      updatedAt: now,
    }),
    listByUserId: async () => [],
  },
  sessions: {
    create: async (input) => ({
      ...session,
      ...input,
      id: sessionId,
      revokedAt: null,
      createdAt: now,
      updatedAt: now,
      lastUsedAt: null,
    }),
    findActiveById: async () => session,
    rotateRefreshToken: async (input) => ({
      ...session,
      id: input.sessionId,
      currentRefreshJti: input.newRefreshJti,
      lastUsedAt: now,
    }),
    revoke: async () => ({ ...session, revokedAt: now }),
    revokeAllByUserId: async () => [{ id: sessionId }],
    listActiveByUserId: async () => [],
    deleteExpired: async () => undefined,
  },
});

const createUnitOfWork = (
  repositories: AuthRepositories,
): AuthUnitOfWork => ({
  run: (work) => work(repositories),
});

const createGoogleVerifier = (
  identity: GoogleIdentity = googleIdentity,
): GoogleAuthVerifier => ({
  verifyIdToken: async () => identity,
});

const tokenPair = {
  accessToken: 'access-token',
  refreshToken: 'refresh-token',
};

const createTokenService = (
  overrides: Partial<AuthTokenService> = {},
): AuthTokenService => ({
  issueTokenPair: async () => tokenPair,
  verifyAccessToken: async () => ({
    userId,
    sessionId,
    tokenId: 'access-token-id',
  }),
  verifyRefreshToken: async () => ({
    userId,
    sessionId,
    tokenId: refreshTokenId,
  }),
  ...overrides,
});

const createService = (
  repositories: AuthRepositories,
  options: {
    googleVerifier?: GoogleAuthVerifier;
    tokenService?: AuthTokenService;
    generateId?: () => string;
  } = {},
) =>
  createAuthService({
    unitOfWork: createUnitOfWork(repositories),
    googleVerifier: options.googleVerifier ?? createGoogleVerifier(),
    tokenService: options.tokenService ?? createTokenService(),
    refreshTokenTtlMs: 30 * 24 * 60 * 60 * 1000,
    now: () => now,
    generateId: options.generateId ?? (() => refreshTokenId),
  });

describe('AuthService', () => {
  it('creates a user, Google identity, session, and tokens on first login', async () => {
    const repositories = createRepositories();
    let identityInput: Parameters<typeof repositories.identities.create>[0] | undefined;
    let sessionInput: Parameters<typeof repositories.sessions.create>[0] | undefined;
    let tokenInput: Parameters<AuthTokenService['issueTokenPair']>[0] | undefined;

    const originalCreateIdentity = repositories.identities.create;
    repositories.identities.create = async (input) => {
      identityInput = input;
      return originalCreateIdentity(input);
    };
    const originalCreateSession = repositories.sessions.create;
    repositories.sessions.create = async (input) => {
      sessionInput = input;
      return originalCreateSession(input);
    };

    const service = createService(repositories, {
      tokenService: createTokenService({
        issueTokenPair: async (input) => {
          tokenInput = input;
          return tokenPair;
        },
      }),
    });

    const result = await service.loginWithGoogle({
      idToken: 'google-id-token',
      userAgent: 'Test Browser',
      ipAddress: '127.0.0.1',
    });

    assert.equal(result.user.id, userId);
    assert.deepEqual(result.tokens, tokenPair);
    assert.deepEqual(identityInput, {
      provider: 'google',
      providerSubject: googleIdentity.subject,
      userId,
      providerEmail: googleIdentity.email,
      emailVerified: true,
    });
    assert.equal(sessionInput?.currentRefreshJti, refreshTokenId);
    assert.equal(tokenInput?.sessionId, sessionId);
    assert.equal(tokenInput?.refreshExpiresAt.getTime(), expiresAt.getTime());
  });

  it('updates an existing Google identity and login profile', async () => {
    const repositories = createRepositories();
    repositories.identities.findUser = async () => joinedUser;
    let profileUpdated = false;
    let identityUpdated = false;
    const updateProfile = repositories.users.updateLoginProfile;
    repositories.users.updateLoginProfile = async (input) => {
      profileUpdated = true;
      return updateProfile(input);
    };
    const updateIdentity = repositories.identities.updateProfile;
    repositories.identities.updateProfile = async (input) => {
      identityUpdated = true;
      return updateIdentity(input);
    };

    const result = await createService(repositories).loginWithGoogle({
      idToken: 'google-id-token',
      userAgent: null,
      ipAddress: null,
    });

    assert.equal(result.user.id, userId);
    assert.equal(profileUpdated, true);
    assert.equal(identityUpdated, true);
  });

  it('rejects unverified email, inactive users, and unlinked email conflicts', async () => {
    const repositories = createRepositories();
    const unverifiedService = createService(repositories, {
      googleVerifier: createGoogleVerifier({
        ...googleIdentity,
        emailVerified: false,
      }),
    });
    await assert.rejects(
      unverifiedService.loginWithGoogle({
        idToken: 'token',
        userAgent: null,
        ipAddress: null,
      }),
      UnauthorizedError,
    );

    repositories.identities.findUser = async () => ({
      ...joinedUser,
      status: 'suspended',
    });
    await assert.rejects(
      createService(repositories).loginWithGoogle({
        idToken: 'token',
        userAgent: null,
        ipAddress: null,
      }),
      ForbiddenError,
    );

    repositories.identities.findUser = async () => null;
    repositories.users.findByEmail = async () => user;
    await assert.rejects(
      createService(repositories).loginWithGoogle({
        idToken: 'token',
        userAgent: null,
        ipAddress: null,
      }),
      ConflictError,
    );
  });

  it('rotates a valid refresh token and issues a new token pair', async () => {
    const repositories = createRepositories();
    let rotationInput:
      | Parameters<typeof repositories.sessions.rotateRefreshToken>[0]
      | undefined;
    const rotate = repositories.sessions.rotateRefreshToken;
    repositories.sessions.rotateRefreshToken = async (input) => {
      rotationInput = input;
      return rotate(input);
    };

    const result = await createService(repositories, {
      generateId: () => newRefreshTokenId,
    }).refresh('refresh-token');

    assert.deepEqual(result, tokenPair);
    assert.deepEqual(rotationInput, {
      sessionId,
      currentRefreshJti: refreshTokenId,
      newRefreshJti: newRefreshTokenId,
    });
  });

  it('revokes the session when refresh token reuse is detected', async () => {
    const repositories = createRepositories();
    repositories.sessions.findActiveById = async () => ({
      ...session,
      currentRefreshJti: newRefreshTokenId,
    });
    let revokedId: string | undefined;
    const revoke = repositories.sessions.revoke;
    repositories.sessions.revoke = async (id) => {
      revokedId = id;
      return revoke(id);
    };

    await assert.rejects(
      createService(repositories).refresh('reused-refresh-token'),
      UnauthorizedError,
    );
    assert.equal(revokedId, sessionId);
  });

  it('supports logout, logout-all, and current-user lookup', async () => {
    const repositories = createRepositories();
    let revokedId: string | undefined;
    repositories.sessions.revoke = async (id) => {
      revokedId = id;
      return { ...session, revokedAt: now };
    };
    const service = createService(repositories);

    await service.logout('refresh-token');
    assert.equal(revokedId, sessionId);
    assert.equal(await service.logoutAll(userId), 1);
    assert.deepEqual(await service.getCurrentUser(userId), user);
  });
});
