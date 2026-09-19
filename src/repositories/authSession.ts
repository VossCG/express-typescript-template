import type { Sql } from 'postgres';

import {
  createAuthSession,
  deleteExpiredAuthSessions,
  getActiveAuthSession,
  listActiveUserAuthSessions,
  revokeAllUserAuthSessions,
  revokeAuthSession,
  rotateAuthSessionRefreshToken,
} from '../database/sqlc/auth_sessions_sql';
import type {
  CreateAuthSessionArgs,
  CreateAuthSessionRow,
  GetActiveAuthSessionRow,
  ListActiveUserAuthSessionsRow,
  RevokeAllUserAuthSessionsRow,
  RevokeAuthSessionRow,
  RotateAuthSessionRefreshTokenArgs,
  RotateAuthSessionRefreshTokenRow,
} from '../database/sqlc/auth_sessions_sql';

export interface AuthSessionRepository {
  create(input: CreateAuthSessionArgs): Promise<CreateAuthSessionRow>;
  findActiveById(id: string): Promise<GetActiveAuthSessionRow | null>;
  rotateRefreshToken(
    input: RotateAuthSessionRefreshTokenArgs,
  ): Promise<RotateAuthSessionRefreshTokenRow | null>;
  revoke(id: string): Promise<RevokeAuthSessionRow | null>;
  revokeAllByUserId(userId: string): Promise<RevokeAllUserAuthSessionsRow[]>;
  listActiveByUserId(userId: string): Promise<ListActiveUserAuthSessionsRow[]>;
  deleteExpired(): Promise<void>;
}

export const createAuthSessionRepository = (
  sql: Sql,
): AuthSessionRepository => ({
  create: async (input) => {
    const session = await createAuthSession(sql, input);
    if (!session) throw new Error('Auth session was not returned after creation');
    return session;
  },

  findActiveById: (id) => getActiveAuthSession(sql, { id }),

  rotateRefreshToken: (input) =>
    rotateAuthSessionRefreshToken(sql, input),

  revoke: (id) => revokeAuthSession(sql, { id }),

  revokeAllByUserId: (userId) =>
    revokeAllUserAuthSessions(sql, { userId }),

  listActiveByUserId: (userId) =>
    listActiveUserAuthSessions(sql, { userId }),

  deleteExpired: () => deleteExpiredAuthSessions(sql),
});
