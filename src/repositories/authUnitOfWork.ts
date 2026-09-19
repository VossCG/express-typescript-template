import type { Sql } from 'postgres';

import {
  createAuthSessionRepository,
  type AuthSessionRepository,
} from './authSession';
import { createUserRepository, type UserRepository } from './user';
import {
  createUserIdentityRepository,
  type UserIdentityRepository,
} from './userIdentity';

export interface AuthRepositories {
  users: UserRepository;
  identities: UserIdentityRepository;
  sessions: AuthSessionRepository;
}

export interface AuthUnitOfWork {
  run<T>(work: (repositories: AuthRepositories) => Promise<T>): Promise<T>;
}

const createRepositories = (sql: Sql): AuthRepositories => ({
  users: createUserRepository(sql),
  identities: createUserIdentityRepository(sql),
  sessions: createAuthSessionRepository(sql),
});

export const createAuthUnitOfWork = (sql: Sql): AuthUnitOfWork => ({
  run: async (work) => {
    const result = await sql.begin(async (transaction) => ({
      value: await work(createRepositories(transaction)),
    }));
    return result.value;
  },
});
