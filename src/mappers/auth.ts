import type { GetUserByIdRow } from '../database/sqlc/users_sql';

export const toAuthUserResponse = (user: GetUserByIdRow) => ({
  id: user.id,
  email: user.email,
  displayName: user.displayName,
  avatarUrl: user.avatarUrl,
});
