import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { UnauthorizedError } from '../src/core/ApiError';
import {
  createGoogleAuthVerifier,
  type GoogleIdTokenClient,
} from '../src/security/googleAuth';

describe('GoogleAuthVerifier', () => {
  it('maps verified Google token claims to a provider-neutral identity', async () => {
    let receivedAudience: string | undefined;
    const client: GoogleIdTokenClient = {
      verifyIdToken: async ({ audience }) => {
        receivedAudience = audience;
        return {
          getPayload: () => ({
            sub: 'google-subject',
            email: 'user@example.com',
            email_verified: true,
            name: 'Example User',
            picture: 'https://example.com/avatar.png',
          }),
        };
      },
    };

    const identity = await createGoogleAuthVerifier(
      'google-client-id',
      client,
    ).verifyIdToken('id-token');

    assert.equal(receivedAudience, 'google-client-id');
    assert.deepEqual(identity, {
      subject: 'google-subject',
      email: 'user@example.com',
      emailVerified: true,
      displayName: 'Example User',
      avatarUrl: 'https://example.com/avatar.png',
    });
  });

  it('returns a generic unauthorized error when verification fails', async () => {
    const client: GoogleIdTokenClient = {
      verifyIdToken: async () => {
        throw new Error('provider-specific details');
      },
    };

    await assert.rejects(
      createGoogleAuthVerifier('google-client-id', client).verifyIdToken(
        'invalid-token',
      ),
      UnauthorizedError,
    );
  });
});
