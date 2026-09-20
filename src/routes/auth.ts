import { authDocs } from '../contracts/auth';
import { createOpenApiRouter } from '../helpers/openApiRouter';
import authController, { authenticate } from '../modules/auth';

const router = createOpenApiRouter({ tags: ['Auth'] });

router.post('/google', authDocs.googleLogin, authController.googleLogin);

router.post('/refresh', authDocs.refresh, authController.refresh);

router.post('/logout', authDocs.logout, authController.logout);

router.post(
  '/logout-all',
  authDocs.logoutAll,
  authenticate,
  authController.logoutAll,
);

router.get('/me', authDocs.me, authenticate, authController.me);

export default router;
