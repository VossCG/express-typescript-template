import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import type { Sql } from 'postgres';

import { createAuthSessionRepository } from '../src/repositories/authSession';
import { createUserRepository } from '../src/repositories/user';
import { createUserIdentityRepository } from '../src/repositories/userIdentity';

interface SqlCall {
  query: string;
  parameters: unknown[];
}

const createFakeSql = (responses: unknown[][][]) => {
  const calls: SqlCall[] = [];
  const sql = {
    unsafe: (query: string, parameters: unknown[]) => {
      calls.push({ query, parameters });
      const rows = responses.shift() ?? [];
      return { values: async () => rows };
    },
  } as unknown as Sql;

  return { calls, sql };
};

const userId = '1f547b90-9752-46d2-99f0-b1501518ce4b';
const sessionId = 'e0372753-b846-4b84-a12a-236be03a50c8';
const refreshJti = '54aff4e4-a71d-49ec-8d9b-1d9dd587a6a4';
const newRefreshJti = '7ea4da57-ff54-442e-9508-8f62b99df53f';
const now = new Date('2026-09-19T08:00:00.000Z');
const expiresAt = new Date('2026-10-19T08:00:00.000Z');

const userRow = [
  userId,
  'user@example.com',
  'Example User',
  'https://example.com/avatar.png',
  'active',
  now,
  now,
  now,
];

const identityRow = [
  'google',
  'google-subject',
  userId,
  'user@example.com',
  true,
  now,
  now,
];

const sessionRow = [
  sessionId,
  userId,
  refreshJti,
  expiresAt,
  null,
  now,
  now,
  null,
  'Test Browser',
  '127.0.0.1',
];

describe('UserRepository', () => {
  it('forwards user query parameters', async () => {
    const fake = createFakeSql([
      [userRow],
      [userRow],
      [userRow],
      [userRow],
      [userRow],
    ]);
    const repository = createUserRepository(fake.sql);

    await repository.create({
      email: 'USER@example.com',
      displayName: 'Example User',
      avatarUrl: null,
    });
    await repository.findById(userId);
    await repository.findByEmail('user@example.com');
    await repository.updateLoginProfile({
      userId,
      displayName: 'Updated User',
      avatarUrl: null,
    });
    await repository.updateStatus({ userId, status: 'suspended' });

    assert.deepEqual(
      fake.calls.map((call) => call.parameters),
      [
        ['USER@example.com', 'Example User', null],
        [userId],
        ['user@example.com'],
        ['Updated User', null, userId],
        ['suspended', userId],
      ],
    );
  });
});

describe('UserIdentityRepository', () => {
  it('forwards provider identity query parameters', async () => {
    const joinedRow = [...userRow, ...identityRow.slice(0, 2), ...identityRow.slice(3, 5)];
    const fake = createFakeSql([
      [identityRow],
      [identityRow],
      [joinedRow],
      [identityRow],
      [identityRow],
    ]);
    const repository = createUserIdentityRepository(fake.sql);
    const identity = {
      provider: 'google',
      providerSubject: 'google-subject',
    };

    await repository.create({
      ...identity,
      userId,
      providerEmail: 'user@example.com',
      emailVerified: true,
    });
    await repository.find(identity);
    await repository.findUser(identity);
    await repository.updateProfile({
      ...identity,
      providerEmail: 'updated@example.com',
      emailVerified: true,
    });
    await repository.listByUserId(userId);

    assert.deepEqual(
      fake.calls.map((call) => call.parameters),
      [
        ['google', 'google-subject', userId, 'user@example.com', true],
        ['google', 'google-subject'],
        ['google', 'google-subject'],
        ['updated@example.com', true, 'google', 'google-subject'],
        [userId],
      ],
    );
  });
});

describe('AuthSessionRepository', () => {
  it('forwards session lifecycle query parameters', async () => {
    const activeListRow = [
      sessionId,
      userId,
      expiresAt,
      now,
      now,
      null,
      'Test Browser',
      '127.0.0.1',
    ];
    const fake = createFakeSql([
      [sessionRow],
      [sessionRow],
      [sessionRow],
      [sessionRow],
      [[sessionId]],
      [activeListRow],
      [],
    ]);
    const repository = createAuthSessionRepository(fake.sql);

    await repository.create({
      userId,
      currentRefreshJti: refreshJti,
      expiresAt,
      userAgent: 'Test Browser',
      ipAddress: '127.0.0.1',
    });
    await repository.findActiveById(sessionId);
    await repository.rotateRefreshToken({
      sessionId,
      currentRefreshJti: refreshJti,
      newRefreshJti,
    });
    await repository.revoke(sessionId);
    await repository.revokeAllByUserId(userId);
    await repository.listActiveByUserId(userId);
    await repository.deleteExpired();

    assert.deepEqual(
      fake.calls.map((call) => call.parameters),
      [
        [userId, refreshJti, expiresAt, 'Test Browser', '127.0.0.1'],
        [sessionId],
        [newRefreshJti, sessionId, refreshJti],
        [sessionId],
        [userId],
        [userId],
        [],
      ],
    );
  });

  it('rejects create operations that return no row', async () => {
    const userRepository = createUserRepository(createFakeSql([[]]).sql);
    const identityRepository = createUserIdentityRepository(
      createFakeSql([[]]).sql,
    );
    const sessionRepository = createAuthSessionRepository(
      createFakeSql([[]]).sql,
    );

    await assert.rejects(
      userRepository.create({
        email: 'user@example.com',
        displayName: null,
        avatarUrl: null,
      }),
      /User was not returned after creation/,
    );
    await assert.rejects(
      identityRepository.create({
        provider: 'google',
        providerSubject: 'google-subject',
        userId,
        providerEmail: 'user@example.com',
        emailVerified: true,
      }),
      /User identity was not returned after creation/,
    );
    await assert.rejects(
      sessionRepository.create({
        userId,
        currentRefreshJti: refreshJti,
        expiresAt,
        userAgent: null,
        ipAddress: null,
      }),
      /Auth session was not returned after creation/,
    );
  });
});
