import { env } from '../config/env';
import { createAuthController } from '../controllers/auth';
import { sql } from '../database';
import { createAuthenticate } from '../middleware/authenticate';
import { createAuthUnitOfWork } from '../repositories/authUnitOfWork';
import { createGoogleAuthVerifier } from '../security/googleAuth';
import { createAuthTokenService } from '../security/jwt';
import { createAuthService } from '../services/auth';

const authTokenService = createAuthTokenService({
  secret: env.JWT_SECRET,
  issuer: env.JWT_ISSUER,
  audience: env.JWT_AUDIENCE,
  accessTokenTtlSeconds: env.JWT_ACCESS_TTL_SECONDS,
});

const authService = createAuthService({
  unitOfWork: createAuthUnitOfWork(sql),
  googleVerifier: createGoogleAuthVerifier(env.GOOGLE_CLIENT_ID),
  tokenService: authTokenService,
  refreshTokenTtlMs: env.JWT_REFRESH_TTL_SECONDS * 1000,
});

export const authenticate = createAuthenticate(authTokenService);

const authController = createAuthController({
  service: authService,
  refreshCookie: {
    name: env.REFRESH_COOKIE_NAME,
    maxAgeMs: env.JWT_REFRESH_TTL_SECONDS * 1000,
    secure: env.NODE_ENV === 'production',
  },
});

export default authController;
