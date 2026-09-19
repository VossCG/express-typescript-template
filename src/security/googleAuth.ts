import { OAuth2Client } from 'google-auth-library';

import { UnauthorizedError } from '../core/ApiError';
import type {
  GoogleAuthVerifier,
  GoogleIdentity,
} from '../services/auth';

interface GoogleTokenPayload {
  sub?: string;
  email?: string;
  email_verified?: boolean;
  name?: string;
  picture?: string;
}

export interface GoogleIdTokenClient {
  verifyIdToken(input: {
    idToken: string;
    audience: string;
  }): Promise<{ getPayload(): GoogleTokenPayload | undefined }>;
}

export const createGoogleAuthVerifier = (
  clientId: string,
  client: GoogleIdTokenClient = new OAuth2Client(clientId),
): GoogleAuthVerifier => ({
  verifyIdToken: async (idToken): Promise<GoogleIdentity> => {
    try {
      const ticket = await client.verifyIdToken({
        idToken,
        audience: clientId,
      });
      const payload = ticket.getPayload();

      if (!payload?.sub || !payload.email) {
        throw new Error('Required Google identity claims are missing');
      }

      return {
        subject: payload.sub,
        email: payload.email,
        emailVerified: payload.email_verified === true,
        displayName: payload.name ?? null,
        avatarUrl: payload.picture ?? null,
      };
    } catch {
      throw new UnauthorizedError('Invalid Google ID token');
    }
  },
});
