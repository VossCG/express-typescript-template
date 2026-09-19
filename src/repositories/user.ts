import type { Sql } from 'postgres';

import {
  createUser,
  getUserByEmail,
  getUserById,
  updateUserLoginProfile,
  updateUserStatus,
} from '../database/sqlc/users_sql';
import type {
  CreateUserArgs,
  CreateUserRow,
  GetUserByEmailRow,
  GetUserByIdRow,
  UpdateUserLoginProfileArgs,
  UpdateUserLoginProfileRow,
  UpdateUserStatusArgs,
  UpdateUserStatusRow,
} from '../database/sqlc/users_sql';

export interface UserRepository {
  create(input: CreateUserArgs): Promise<CreateUserRow>;
  findById(id: string): Promise<GetUserByIdRow | null>;
  findByEmail(email: string): Promise<GetUserByEmailRow | null>;
  updateLoginProfile(
    input: UpdateUserLoginProfileArgs,
  ): Promise<UpdateUserLoginProfileRow | null>;
  updateStatus(input: UpdateUserStatusArgs): Promise<UpdateUserStatusRow | null>;
}

export const createUserRepository = (sql: Sql): UserRepository => ({
  create: async (input) => {
    const user = await createUser(sql, input);
    if (!user) throw new Error('User was not returned after creation');
    return user;
  },

  findById: (id) => getUserById(sql, { id }),

  findByEmail: (email) => getUserByEmail(sql, { email }),

  updateLoginProfile: (input) => updateUserLoginProfile(sql, input),

  updateStatus: (input) => updateUserStatus(sql, input),
});
