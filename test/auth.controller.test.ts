import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import type { NextFunction, Request, Response } from 'express';

import { createAuthController } from '../src/controllers/auth';
import { UnauthorizedError } from '../src/core/ApiError';
import type { AuthService } from '../src/services/auth';

const user = {
  id: '1f547b90-9752-46d2-99f0-b1501518ce4b',
  email: 'user@example.com',
  displayName: 'Example User',
  avatarUrl: null,
  status: 'active',
  lastLoginAt: null,
  createdAt: new Date('2026-09-20T08:00:00.000Z'),
  updatedAt: new Date('2026-09-20T09:00:00.000Z'),
};

const createFakeService = (
  overrides: Partial<AuthService> = {},
): AuthService => ({
  loginWithGoogle: async () => ({
    user,
    tokens: { accessToken: 'access-token', refreshToken: 'refresh-token' },
  }),
  refresh: async () => ({
    accessToken: 'new-access-token',
    refreshToken: 'new-refresh-token',
  }),
  logout: async () => undefined,
  logoutAll: async () => 2,
  getCurrentUser: async () => user,
  ...overrides,
});

const refreshCookie = {
  name: 'refresh_token',
  maxAgeMs: 60_000,
  secure: false,
};

const createResponseRecorder = () => {
  const result: {
    status?: number;
    body?: unknown;
    cookie?: { name: string; value: string };
    clearedCookie?: string;
  } = {};
  let response: Response;

  response = {
    locals: {},
    status: (status: number) => {
      result.status = status;
      return response;
    },
    json: (body: unknown) => {
      result.body = body;
      return response;
    },
    cookie: (name: string, value: string) => {
      result.cookie = { name, value };
      return response;
    },
    clearCookie: (name: string) => {
      result.clearedCookie = name;
      return response;
    },
  } as unknown as Response;

  return { response, result };
};

const next = (() => undefined) as NextFunction;

describe('AuthController', () => {
  it('logs in and preserves the refresh cookie response contract', async () => {
    let loginInput: Parameters<AuthService['loginWithGoogle']>[0] | undefined;
    const controller = createAuthController({
      service: createFakeService({
        loginWithGoogle: async (input) => {
          loginInput = input;
          return {
            user,
            tokens: {
              accessToken: 'access-token',
              refreshToken: 'refresh-token',
            },
          };
        },
      }),
      refreshCookie,
    });
    const { response, result } = createResponseRecorder();
    const request = {
      body: { idToken: 'google-id-token' },
      ip: '127.0.0.1',
      get: (name: string) =>
        name.toLowerCase() === 'user-agent' ? 'test-agent' : undefined,
    } as unknown as Request;

    await controller.googleLogin(request, response, next);

    assert.deepEqual(loginInput, {
      idToken: 'google-id-token',
      userAgent: 'test-agent',
      ipAddress: '127.0.0.1',
    });
    assert.deepEqual(result.cookie, {
      name: 'refresh_token',
      value: 'refresh-token',
    });
    assert.equal(result.status, 200);
    assert.deepEqual(result.body, {
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          displayName: user.displayName,
          avatarUrl: user.avatarUrl,
        },
        accessToken: 'access-token',
      },
    });
  });

  it('rejects refresh requests without the cookie', async () => {
    const controller = createAuthController({
      service: createFakeService(),
      refreshCookie,
    });
    const { response } = createResponseRecorder();

    await assert.rejects(
      async () =>
        controller.refresh(
          { cookies: {} } as Request,
          response,
          next,
        ),
      UnauthorizedError,
    );
  });
});
