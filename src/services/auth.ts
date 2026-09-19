import { randomUUID } from 'node:crypto';

import {
  ConflictError,
  ForbiddenError,
  NotFoundError,
  UnauthorizedError,
} from '../core/ApiError';
import type { GetUserByIdRow } from '../database/sqlc/users_sql';
import type {
  AuthRepositories,
  AuthUnitOfWork,
} from '../repositories/authUnitOfWork';

const GOOGLE_PROVIDER = 'google';

export interface GoogleIdentity {
  subject: string;
  email: string;
  emailVerified: boolean;
  displayName: string | null;
  avatarUrl: string | null;
}

export interface GoogleAuthVerifier {
  verifyIdToken(idToken: string): Promise<GoogleIdentity>;
}

export interface RefreshTokenClaims {
  userId: string;
  sessionId: string;
  tokenId: string;
}

export interface AccessTokenClaims {
  userId: string;
  sessionId: string;
  tokenId: string;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

export interface AuthTokenService {
  issueTokenPair(input: {
    userId: string;
    sessionId: string;
    refreshTokenId: string;
    refreshExpiresAt: Date;
  }): Promise<TokenPair>;
  verifyAccessToken(token: string): Promise<AccessTokenClaims>;
  verifyRefreshToken(token: string): Promise<RefreshTokenClaims>;
}

export interface LoginMetadata {
  userAgent: string | null;
  ipAddress: string | null;
}

export interface LoginWithGoogleInput extends LoginMetadata {
  idToken: string;
}

export interface LoginResult {
  user: GetUserByIdRow;
  tokens: TokenPair;
}

type RefreshResult =
  | { status: 'success'; tokens: TokenPair }
  | { status: 'invalid' }
  | { status: 'reuse' };

export interface AuthService {
  loginWithGoogle(input: LoginWithGoogleInput): Promise<LoginResult>;
  refresh(refreshToken: string): Promise<TokenPair>;
  logout(refreshToken: string): Promise<void>;
  logoutAll(userId: string): Promise<number>;
  getCurrentUser(userId: string): Promise<GetUserByIdRow>;
}

export interface AuthServiceDependencies {
  unitOfWork: AuthUnitOfWork;
  googleVerifier: GoogleAuthVerifier;
  tokenService: AuthTokenService;
  refreshTokenTtlMs: number;
  now?: () => Date;
  generateId?: () => string;
}

const assertActive = (status: string): void => {
  if (status !== 'active') {
    throw new ForbiddenError('Account is not active');
  }
};

const createSessionAndTokens = async (
  repositories: AuthRepositories,
  tokenService: AuthTokenService,
  userId: string,
  metadata: LoginMetadata,
  refreshExpiresAt: Date,
  generateId: () => string,
): Promise<TokenPair> => {
  const refreshTokenId = generateId();
  const session = await repositories.sessions.create({
    userId,
    currentRefreshJti: refreshTokenId,
    expiresAt: refreshExpiresAt,
    userAgent: metadata.userAgent,
    ipAddress: metadata.ipAddress,
  });

  return tokenService.issueTokenPair({
    userId,
    sessionId: session.id,
    refreshTokenId,
    refreshExpiresAt,
  });
};

export const createAuthService = (
  dependencies: AuthServiceDependencies,
): AuthService => {
  const {
    unitOfWork,
    googleVerifier,
    tokenService,
    refreshTokenTtlMs,
    now = () => new Date(),
    generateId = randomUUID,
  } = dependencies;

  if (!Number.isFinite(refreshTokenTtlMs) || refreshTokenTtlMs <= 0) {
    throw new Error('refreshTokenTtlMs must be a positive finite number');
  }

  return {
    loginWithGoogle: async (input) => {
      const googleIdentity = await googleVerifier.verifyIdToken(input.idToken);
      if (!googleIdentity.emailVerified) {
        throw new UnauthorizedError('Google email is not verified');
      }

      const refreshExpiresAt = new Date(now().getTime() + refreshTokenTtlMs);

      return unitOfWork.run(async (repositories) => {
        const identityKey = {
          provider: GOOGLE_PROVIDER,
          providerSubject: googleIdentity.subject,
        };
        const existingUser = await repositories.identities.findUser(identityKey);

        let user: GetUserByIdRow;

        if (existingUser) {
          assertActive(existingUser.status);

          const identity = await repositories.identities.updateProfile({
            ...identityKey,
            providerEmail: googleIdentity.email,
            emailVerified: googleIdentity.emailVerified,
          });
          if (!identity) {
            throw new Error('User identity disappeared during login');
          }

          const updatedUser = await repositories.users.updateLoginProfile({
            userId: existingUser.id,
            displayName: googleIdentity.displayName,
            avatarUrl: googleIdentity.avatarUrl,
          });
          if (!updatedUser) {
            throw new Error('User disappeared during login');
          }
          user = updatedUser;
        } else {
          const emailOwner = await repositories.users.findByEmail(
            googleIdentity.email,
          );
          if (emailOwner) {
            throw new ConflictError(
              'An account with this email already exists',
            );
          }

          user = await repositories.users.create({
            email: googleIdentity.email,
            displayName: googleIdentity.displayName,
            avatarUrl: googleIdentity.avatarUrl,
          });
          await repositories.identities.create({
            ...identityKey,
            userId: user.id,
            providerEmail: googleIdentity.email,
            emailVerified: googleIdentity.emailVerified,
          });
        }

        const tokens = await createSessionAndTokens(
          repositories,
          tokenService,
          user.id,
          input,
          refreshExpiresAt,
          generateId,
        );

        return { user, tokens };
      });
    },

    refresh: async (refreshToken) => {
      const claims = await tokenService.verifyRefreshToken(refreshToken);
      const newRefreshTokenId = generateId();

      const result: RefreshResult = await unitOfWork.run(async (repositories) => {
        const session = await repositories.sessions.findActiveById(
          claims.sessionId,
        );
        if (!session || session.userId !== claims.userId) {
          return { status: 'invalid' };
        }

        if (session.currentRefreshJti !== claims.tokenId) {
          await repositories.sessions.revoke(session.id);
          return { status: 'reuse' };
        }

        const user = await repositories.users.findById(claims.userId);
        if (!user) return { status: 'invalid' };
        assertActive(user.status);

        const rotated = await repositories.sessions.rotateRefreshToken({
          sessionId: session.id,
          currentRefreshJti: claims.tokenId,
          newRefreshJti: newRefreshTokenId,
        });
        if (!rotated) {
          await repositories.sessions.revoke(session.id);
          return { status: 'reuse' };
        }

        const tokens = await tokenService.issueTokenPair({
          userId: user.id,
          sessionId: rotated.id,
          refreshTokenId: newRefreshTokenId,
          refreshExpiresAt: rotated.expiresAt,
        });
        return { status: 'success', tokens };
      });

      if (result.status === 'invalid') {
        throw new UnauthorizedError('Invalid refresh token');
      }
      if (result.status === 'reuse') {
        throw new UnauthorizedError('Refresh token reuse detected');
      }
      return result.tokens;
    },

    logout: async (refreshToken) => {
      const claims = await tokenService.verifyRefreshToken(refreshToken);
      await unitOfWork.run(async (repositories) => {
        const session = await repositories.sessions.findActiveById(
          claims.sessionId,
        );
        if (session?.userId === claims.userId) {
          await repositories.sessions.revoke(session.id);
        }
      });
    },

    logoutAll: (userId) =>
      unitOfWork.run(async (repositories) => {
        const revoked = await repositories.sessions.revokeAllByUserId(userId);
        return revoked.length;
      }),

    getCurrentUser: (userId) =>
      unitOfWork.run(async (repositories) => {
        const user = await repositories.users.findById(userId);
        if (!user) throw new NotFoundError('User not found');
        assertActive(user.status);
        return user;
      }),
  };
};
