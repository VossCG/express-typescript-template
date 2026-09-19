import { Sql } from "postgres";

export const createUserQuery = `-- name: CreateUser :one
INSERT INTO users (
  email,
  display_name,
  avatar_url,
  last_login_at
)
VALUES (
  LOWER($1::text),
  $2,
  $3,
  NOW()
)
RETURNING
  id,
  email,
  display_name,
  avatar_url,
  status,
  last_login_at,
  created_at,
  updated_at`;

export interface CreateUserArgs {
    email: string;
    displayName: string | null;
    avatarUrl: string | null;
}

export interface CreateUserRow {
    id: string;
    email: string;
    displayName: string | null;
    avatarUrl: string | null;
    status: string;
    lastLoginAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
}

export async function createUser(sql: Sql, args: CreateUserArgs): Promise<CreateUserRow | null> {
    const rows = await sql.unsafe(createUserQuery, [args.email, args.displayName, args.avatarUrl]).values();
    if (rows.length !== 1) {
        return null;
    }
    const row = rows[0];
    return {
        id: row[0],
        email: row[1],
        displayName: row[2],
        avatarUrl: row[3],
        status: row[4],
        lastLoginAt: row[5],
        createdAt: row[6],
        updatedAt: row[7]
    };
}

export const getUserByIdQuery = `-- name: GetUserById :one
SELECT
  id,
  email,
  display_name,
  avatar_url,
  status,
  last_login_at,
  created_at,
  updated_at
FROM users
WHERE id = $1`;

export interface GetUserByIdArgs {
    id: string;
}

export interface GetUserByIdRow {
    id: string;
    email: string;
    displayName: string | null;
    avatarUrl: string | null;
    status: string;
    lastLoginAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
}

export async function getUserById(sql: Sql, args: GetUserByIdArgs): Promise<GetUserByIdRow | null> {
    const rows = await sql.unsafe(getUserByIdQuery, [args.id]).values();
    if (rows.length !== 1) {
        return null;
    }
    const row = rows[0];
    return {
        id: row[0],
        email: row[1],
        displayName: row[2],
        avatarUrl: row[3],
        status: row[4],
        lastLoginAt: row[5],
        createdAt: row[6],
        updatedAt: row[7]
    };
}

export const getUserByEmailQuery = `-- name: GetUserByEmail :one
SELECT
  id,
  email,
  display_name,
  avatar_url,
  status,
  last_login_at,
  created_at,
  updated_at
FROM users
WHERE LOWER(email) = LOWER($1::text)`;

export interface GetUserByEmailArgs {
    email: string;
}

export interface GetUserByEmailRow {
    id: string;
    email: string;
    displayName: string | null;
    avatarUrl: string | null;
    status: string;
    lastLoginAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
}

export async function getUserByEmail(sql: Sql, args: GetUserByEmailArgs): Promise<GetUserByEmailRow | null> {
    const rows = await sql.unsafe(getUserByEmailQuery, [args.email]).values();
    if (rows.length !== 1) {
        return null;
    }
    const row = rows[0];
    return {
        id: row[0],
        email: row[1],
        displayName: row[2],
        avatarUrl: row[3],
        status: row[4],
        lastLoginAt: row[5],
        createdAt: row[6],
        updatedAt: row[7]
    };
}

export const updateUserLoginProfileQuery = `-- name: UpdateUserLoginProfile :one
UPDATE users
SET display_name = COALESCE($1, display_name),
    avatar_url = COALESCE($2, avatar_url),
    last_login_at = NOW(),
    updated_at = NOW()
WHERE id = $3
RETURNING
  id,
  email,
  display_name,
  avatar_url,
  status,
  last_login_at,
  created_at,
  updated_at`;

export interface UpdateUserLoginProfileArgs {
    displayName: string | null;
    avatarUrl: string | null;
    userId: string;
}

export interface UpdateUserLoginProfileRow {
    id: string;
    email: string;
    displayName: string | null;
    avatarUrl: string | null;
    status: string;
    lastLoginAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
}

export async function updateUserLoginProfile(sql: Sql, args: UpdateUserLoginProfileArgs): Promise<UpdateUserLoginProfileRow | null> {
    const rows = await sql.unsafe(updateUserLoginProfileQuery, [args.displayName, args.avatarUrl, args.userId]).values();
    if (rows.length !== 1) {
        return null;
    }
    const row = rows[0];
    return {
        id: row[0],
        email: row[1],
        displayName: row[2],
        avatarUrl: row[3],
        status: row[4],
        lastLoginAt: row[5],
        createdAt: row[6],
        updatedAt: row[7]
    };
}

export const updateUserStatusQuery = `-- name: UpdateUserStatus :one
UPDATE users
SET status = $1,
    updated_at = NOW()
WHERE id = $2
RETURNING
  id,
  email,
  display_name,
  avatar_url,
  status,
  last_login_at,
  created_at,
  updated_at`;

export interface UpdateUserStatusArgs {
    status: string;
    userId: string;
}

export interface UpdateUserStatusRow {
    id: string;
    email: string;
    displayName: string | null;
    avatarUrl: string | null;
    status: string;
    lastLoginAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
}

export async function updateUserStatus(sql: Sql, args: UpdateUserStatusArgs): Promise<UpdateUserStatusRow | null> {
    const rows = await sql.unsafe(updateUserStatusQuery, [args.status, args.userId]).values();
    if (rows.length !== 1) {
        return null;
    }
    const row = rows[0];
    return {
        id: row[0],
        email: row[1],
        displayName: row[2],
        avatarUrl: row[3],
        status: row[4],
        lastLoginAt: row[5],
        createdAt: row[6],
        updatedAt: row[7]
    };
}

