import { defineOperation } from '../helpers/openApiRouter';
import {
  authUserSchema,
  googleLoginSchema,
  loginResponseSchema,
  logoutAllResponseSchema,
  refreshResponseSchema,
} from '../schemas/auth';

export const authDocs = {
  googleLogin: defineOperation({
    summary: 'Sign in with Google',
    description:
      'Verifies a Google ID token, creates or updates the local user, and starts a session. The refresh token is returned as an HttpOnly cookie.',
    body: googleLoginSchema,
    response: loginResponseSchema,
    errors: [400, 401, 403, 409, 500],
  }),

  refresh: defineOperation({
    summary: 'Refresh the access token',
    description:
      'Rotates the refresh token from the HttpOnly cookie and returns a new access token.',
    response: refreshResponseSchema,
    errors: [401, 403, 500],
  }),

  logout: defineOperation({
    summary: 'Sign out of the current session',
    status: 204,
    errors: [401, 500],
  }),

  logoutAll: defineOperation({
    summary: 'Sign out of all sessions',
    security: [{ bearerAuth: [] }],
    response: logoutAllResponseSchema,
    errors: [401, 500],
  }),

  me: defineOperation({
    summary: 'Get the current user',
    security: [{ bearerAuth: [] }],
    response: authUserSchema,
    errors: [401, 403, 404, 500],
  }),
};
