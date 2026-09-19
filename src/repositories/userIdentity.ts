import type { Sql } from 'postgres';

import {
  createUserIdentity,
  getUserByIdentity,
  getUserIdentity,
  listUserIdentities,
  updateUserIdentityProfile,
} from '../database/sqlc/user_identities_sql';
import type {
  CreateUserIdentityArgs,
  CreateUserIdentityRow,
  GetUserByIdentityArgs,
  GetUserByIdentityRow,
  GetUserIdentityArgs,
  GetUserIdentityRow,
  ListUserIdentitiesRow,
  UpdateUserIdentityProfileArgs,
  UpdateUserIdentityProfileRow,
} from '../database/sqlc/user_identities_sql';

export interface UserIdentityRepository {
  create(input: CreateUserIdentityArgs): Promise<CreateUserIdentityRow>;
  find(input: GetUserIdentityArgs): Promise<GetUserIdentityRow | null>;
  findUser(
    input: GetUserByIdentityArgs,
  ): Promise<GetUserByIdentityRow | null>;
  updateProfile(
    input: UpdateUserIdentityProfileArgs,
  ): Promise<UpdateUserIdentityProfileRow | null>;
  listByUserId(userId: string): Promise<ListUserIdentitiesRow[]>;
}

export const createUserIdentityRepository = (
  sql: Sql,
): UserIdentityRepository => ({
  create: async (input) => {
    const identity = await createUserIdentity(sql, input);
    if (!identity) {
      throw new Error('User identity was not returned after creation');
    }
    return identity;
  },

  find: (input) => getUserIdentity(sql, input),

  findUser: (input) => getUserByIdentity(sql, input),

  updateProfile: (input) => updateUserIdentityProfile(sql, input),

  listByUserId: (userId) => listUserIdentities(sql, { userId }),
});
