import { Router } from 'express';

import { env } from '../config/env';
import { sql } from '../database';
import { createAuthenticate } from '../middleware/authenticate';
import { createAuthUnitOfWork } from '../repositories/authUnitOfWork';
import { createTaskRepository } from '../repositories/task';
import { createGoogleAuthVerifier } from '../security/googleAuth';
import { createAuthTokenService } from '../security/jwt';
import { createAuthService } from '../services/auth';
import { createTaskService } from '../services/task';
import { createAuthRouter } from './auth';
import healthRoutes from './health';
import { createTaskRouter } from './task';

const router = Router();
const taskRepository = createTaskRepository(sql);
const taskService = createTaskService(taskRepository);
const taskRoutes = createTaskRouter(taskService);

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
const authRoutes = createAuthRouter({
  service: authService,
  authenticate: createAuthenticate(authTokenService),
  refreshCookie: {
    name: env.REFRESH_COOKIE_NAME,
    maxAgeMs: env.JWT_REFRESH_TTL_SECONDS * 1000,
    secure: env.NODE_ENV === 'production',
  },
});

router.use('/health', healthRoutes);
router.use('/api/v1/auth', authRoutes);
router.use('/api/v1/tasks', taskRoutes);

export default router;
