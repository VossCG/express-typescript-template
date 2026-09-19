import { Sql } from "postgres";

export const createAuthSessionQuery = `-- name: CreateAuthSession :one
INSERT INTO auth_sessions (
  user_id,
  current_refresh_jti,
  expires_at,
  user_agent,
  ip_address
)
VALUES (
  $1,
  $2,
  $3,
  $4,
  $5
)
RETURNING
  id,
  user_id,
  current_refresh_jti,
  expires_at,
  revoked_at,
  created_at,
  updated_at,
  last_used_at,
  user_agent,
  ip_address`;

export interface CreateAuthSessionArgs {
    userId: string;
    currentRefreshJti: string;
    expiresAt: Date;
    userAgent: string | null;
    ipAddress: string | null;
}

export interface CreateAuthSessionRow {
    id: string;
    userId: string;
    currentRefreshJti: string;
    expiresAt: Date;
    revokedAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
    lastUsedAt: Date | null;
    userAgent: string | null;
    ipAddress: string | null;
}

export async function createAuthSession(sql: Sql, args: CreateAuthSessionArgs): Promise<CreateAuthSessionRow | null> {
    const rows = await sql.unsafe(createAuthSessionQuery, [args.userId, args.currentRefreshJti, args.expiresAt, args.userAgent, args.ipAddress]).values();
    if (rows.length !== 1) {
        return null;
    }
    const row = rows[0];
    return {
        id: row[0],
        userId: row[1],
        currentRefreshJti: row[2],
        expiresAt: row[3],
        revokedAt: row[4],
        createdAt: row[5],
        updatedAt: row[6],
        lastUsedAt: row[7],
        userAgent: row[8],
        ipAddress: row[9]
    };
}

export const getActiveAuthSessionQuery = `-- name: GetActiveAuthSession :one
SELECT
  id,
  user_id,
  current_refresh_jti,
  expires_at,
  revoked_at,
  created_at,
  updated_at,
  last_used_at,
  user_agent,
  ip_address
FROM auth_sessions
WHERE id = $1
  AND revoked_at IS NULL
  AND expires_at > NOW()`;

export interface GetActiveAuthSessionArgs {
    id: string;
}

export interface GetActiveAuthSessionRow {
    id: string;
    userId: string;
    currentRefreshJti: string;
    expiresAt: Date;
    revokedAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
    lastUsedAt: Date | null;
    userAgent: string | null;
    ipAddress: string | null;
}

export async function getActiveAuthSession(sql: Sql, args: GetActiveAuthSessionArgs): Promise<GetActiveAuthSessionRow | null> {
    const rows = await sql.unsafe(getActiveAuthSessionQuery, [args.id]).values();
    if (rows.length !== 1) {
        return null;
    }
    const row = rows[0];
    return {
        id: row[0],
        userId: row[1],
        currentRefreshJti: row[2],
        expiresAt: row[3],
        revokedAt: row[4],
        createdAt: row[5],
        updatedAt: row[6],
        lastUsedAt: row[7],
        userAgent: row[8],
        ipAddress: row[9]
    };
}

export const rotateAuthSessionRefreshTokenQuery = `-- name: RotateAuthSessionRefreshToken :one
UPDATE auth_sessions
SET current_refresh_jti = $1,
    last_used_at = NOW(),
    updated_at = NOW()
WHERE id = $2
  AND current_refresh_jti = $3
  AND revoked_at IS NULL
  AND expires_at > NOW()
RETURNING
  id,
  user_id,
  current_refresh_jti,
  expires_at,
  revoked_at,
  created_at,
  updated_at,
  last_used_at,
  user_agent,
  ip_address`;

export interface RotateAuthSessionRefreshTokenArgs {
    newRefreshJti: string;
    sessionId: string;
    currentRefreshJti: string;
}

export interface RotateAuthSessionRefreshTokenRow {
    id: string;
    userId: string;
    currentRefreshJti: string;
    expiresAt: Date;
    revokedAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
    lastUsedAt: Date | null;
    userAgent: string | null;
    ipAddress: string | null;
}

export async function rotateAuthSessionRefreshToken(sql: Sql, args: RotateAuthSessionRefreshTokenArgs): Promise<RotateAuthSessionRefreshTokenRow | null> {
    const rows = await sql.unsafe(rotateAuthSessionRefreshTokenQuery, [args.newRefreshJti, args.sessionId, args.currentRefreshJti]).values();
    if (rows.length !== 1) {
        return null;
    }
    const row = rows[0];
    return {
        id: row[0],
        userId: row[1],
        currentRefreshJti: row[2],
        expiresAt: row[3],
        revokedAt: row[4],
        createdAt: row[5],
        updatedAt: row[6],
        lastUsedAt: row[7],
        userAgent: row[8],
        ipAddress: row[9]
    };
}

export const revokeAuthSessionQuery = `-- name: RevokeAuthSession :one
UPDATE auth_sessions
SET revoked_at = COALESCE(revoked_at, NOW()),
    updated_at = NOW()
WHERE id = $1
RETURNING
  id,
  user_id,
  current_refresh_jti,
  expires_at,
  revoked_at,
  created_at,
  updated_at,
  last_used_at,
  user_agent,
  ip_address`;

export interface RevokeAuthSessionArgs {
    id: string;
}

export interface RevokeAuthSessionRow {
    id: string;
    userId: string;
    currentRefreshJti: string;
    expiresAt: Date;
    revokedAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
    lastUsedAt: Date | null;
    userAgent: string | null;
    ipAddress: string | null;
}

export async function revokeAuthSession(sql: Sql, args: RevokeAuthSessionArgs): Promise<RevokeAuthSessionRow | null> {
    const rows = await sql.unsafe(revokeAuthSessionQuery, [args.id]).values();
    if (rows.length !== 1) {
        return null;
    }
    const row = rows[0];
    return {
        id: row[0],
        userId: row[1],
        currentRefreshJti: row[2],
        expiresAt: row[3],
        revokedAt: row[4],
        createdAt: row[5],
        updatedAt: row[6],
        lastUsedAt: row[7],
        userAgent: row[8],
        ipAddress: row[9]
    };
}

export const revokeAllUserAuthSessionsQuery = `-- name: RevokeAllUserAuthSessions :many
UPDATE auth_sessions
SET revoked_at = COALESCE(revoked_at, NOW()),
    updated_at = NOW()
WHERE user_id = $1
  AND revoked_at IS NULL
RETURNING id`;

export interface RevokeAllUserAuthSessionsArgs {
    userId: string;
}

export interface RevokeAllUserAuthSessionsRow {
    id: string;
}

export async function revokeAllUserAuthSessions(sql: Sql, args: RevokeAllUserAuthSessionsArgs): Promise<RevokeAllUserAuthSessionsRow[]> {
    return (await sql.unsafe(revokeAllUserAuthSessionsQuery, [args.userId]).values()).map(row => ({
        id: row[0]
    }));
}

export const listActiveUserAuthSessionsQuery = `-- name: ListActiveUserAuthSessions :many
SELECT
  id,
  user_id,
  expires_at,
  created_at,
  updated_at,
  last_used_at,
  user_agent,
  ip_address
FROM auth_sessions
WHERE user_id = $1
  AND revoked_at IS NULL
  AND expires_at > NOW()
ORDER BY created_at DESC`;

export interface ListActiveUserAuthSessionsArgs {
    userId: string;
}

export interface ListActiveUserAuthSessionsRow {
    id: string;
    userId: string;
    expiresAt: Date;
    createdAt: Date;
    updatedAt: Date;
    lastUsedAt: Date | null;
    userAgent: string | null;
    ipAddress: string | null;
}

export async function listActiveUserAuthSessions(sql: Sql, args: ListActiveUserAuthSessionsArgs): Promise<ListActiveUserAuthSessionsRow[]> {
    return (await sql.unsafe(listActiveUserAuthSessionsQuery, [args.userId]).values()).map(row => ({
        id: row[0],
        userId: row[1],
        expiresAt: row[2],
        createdAt: row[3],
        updatedAt: row[4],
        lastUsedAt: row[5],
        userAgent: row[6],
        ipAddress: row[7]
    }));
}

export const deleteExpiredAuthSessionsQuery = `-- name: DeleteExpiredAuthSessions :exec
DELETE FROM auth_sessions
WHERE expires_at <= NOW()`;

export async function deleteExpiredAuthSessions(sql: Sql): Promise<void> {
    await sql.unsafe(deleteExpiredAuthSessionsQuery, []);
}

