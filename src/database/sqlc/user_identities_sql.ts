import { Sql } from "postgres";

export const createUserIdentityQuery = `-- name: CreateUserIdentity :one
INSERT INTO user_identities (
  provider,
  provider_subject,
  user_id,
  provider_email,
  email_verified
)
VALUES (
  LOWER($1::text),
  $2,
  $3,
  LOWER($4::text),
  $5
)
RETURNING
  provider,
  provider_subject,
  user_id,
  provider_email,
  email_verified,
  created_at,
  updated_at`;

export interface CreateUserIdentityArgs {
    provider: string;
    providerSubject: string;
    userId: string;
    providerEmail: string | null;
    emailVerified: boolean;
}

export interface CreateUserIdentityRow {
    provider: string;
    providerSubject: string;
    userId: string;
    providerEmail: string | null;
    emailVerified: boolean;
    createdAt: Date;
    updatedAt: Date;
}

export async function createUserIdentity(sql: Sql, args: CreateUserIdentityArgs): Promise<CreateUserIdentityRow | null> {
    const rows = await sql.unsafe(createUserIdentityQuery, [args.provider, args.providerSubject, args.userId, args.providerEmail, args.emailVerified]).values();
    if (rows.length !== 1) {
        return null;
    }
    const row = rows[0];
    return {
        provider: row[0],
        providerSubject: row[1],
        userId: row[2],
        providerEmail: row[3],
        emailVerified: row[4],
        createdAt: row[5],
        updatedAt: row[6]
    };
}

export const getUserIdentityQuery = `-- name: GetUserIdentity :one
SELECT
  provider,
  provider_subject,
  user_id,
  provider_email,
  email_verified,
  created_at,
  updated_at
FROM user_identities
WHERE provider = LOWER($1::text)
  AND provider_subject = $2`;

export interface GetUserIdentityArgs {
    provider: string;
    providerSubject: string;
}

export interface GetUserIdentityRow {
    provider: string;
    providerSubject: string;
    userId: string;
    providerEmail: string | null;
    emailVerified: boolean;
    createdAt: Date;
    updatedAt: Date;
}

export async function getUserIdentity(sql: Sql, args: GetUserIdentityArgs): Promise<GetUserIdentityRow | null> {
    const rows = await sql.unsafe(getUserIdentityQuery, [args.provider, args.providerSubject]).values();
    if (rows.length !== 1) {
        return null;
    }
    const row = rows[0];
    return {
        provider: row[0],
        providerSubject: row[1],
        userId: row[2],
        providerEmail: row[3],
        emailVerified: row[4],
        createdAt: row[5],
        updatedAt: row[6]
    };
}

export const getUserByIdentityQuery = `-- name: GetUserByIdentity :one
SELECT
  users.id,
  users.email,
  users.display_name,
  users.avatar_url,
  users.status,
  users.last_login_at,
  users.created_at,
  users.updated_at,
  user_identities.provider,
  user_identities.provider_subject,
  user_identities.provider_email,
  user_identities.email_verified
FROM user_identities
JOIN users ON users.id = user_identities.user_id
WHERE user_identities.provider = LOWER($1::text)
  AND user_identities.provider_subject = $2`;

export interface GetUserByIdentityArgs {
    provider: string;
    providerSubject: string;
}

export interface GetUserByIdentityRow {
    id: string;
    email: string;
    displayName: string | null;
    avatarUrl: string | null;
    status: string;
    lastLoginAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
    provider: string;
    providerSubject: string;
    providerEmail: string | null;
    emailVerified: boolean;
}

export async function getUserByIdentity(sql: Sql, args: GetUserByIdentityArgs): Promise<GetUserByIdentityRow | null> {
    const rows = await sql.unsafe(getUserByIdentityQuery, [args.provider, args.providerSubject]).values();
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
        updatedAt: row[7],
        provider: row[8],
        providerSubject: row[9],
        providerEmail: row[10],
        emailVerified: row[11]
    };
}

export const updateUserIdentityProfileQuery = `-- name: UpdateUserIdentityProfile :one
UPDATE user_identities
SET provider_email = LOWER($1::text),
    email_verified = $2,
    updated_at = NOW()
WHERE provider = LOWER($3::text)
  AND provider_subject = $4
RETURNING
  provider,
  provider_subject,
  user_id,
  provider_email,
  email_verified,
  created_at,
  updated_at`;

export interface UpdateUserIdentityProfileArgs {
    providerEmail: string | null;
    emailVerified: boolean;
    provider: string;
    providerSubject: string;
}

export interface UpdateUserIdentityProfileRow {
    provider: string;
    providerSubject: string;
    userId: string;
    providerEmail: string | null;
    emailVerified: boolean;
    createdAt: Date;
    updatedAt: Date;
}

export async function updateUserIdentityProfile(sql: Sql, args: UpdateUserIdentityProfileArgs): Promise<UpdateUserIdentityProfileRow | null> {
    const rows = await sql.unsafe(updateUserIdentityProfileQuery, [args.providerEmail, args.emailVerified, args.provider, args.providerSubject]).values();
    if (rows.length !== 1) {
        return null;
    }
    const row = rows[0];
    return {
        provider: row[0],
        providerSubject: row[1],
        userId: row[2],
        providerEmail: row[3],
        emailVerified: row[4],
        createdAt: row[5],
        updatedAt: row[6]
    };
}

export const listUserIdentitiesQuery = `-- name: ListUserIdentities :many
SELECT
  provider,
  provider_subject,
  user_id,
  provider_email,
  email_verified,
  created_at,
  updated_at
FROM user_identities
WHERE user_id = $1
ORDER BY created_at ASC`;

export interface ListUserIdentitiesArgs {
    userId: string;
}

export interface ListUserIdentitiesRow {
    provider: string;
    providerSubject: string;
    userId: string;
    providerEmail: string | null;
    emailVerified: boolean;
    createdAt: Date;
    updatedAt: Date;
}

export async function listUserIdentities(sql: Sql, args: ListUserIdentitiesArgs): Promise<ListUserIdentitiesRow[]> {
    return (await sql.unsafe(listUserIdentitiesQuery, [args.userId]).values()).map(row => ({
        provider: row[0],
        providerSubject: row[1],
        userId: row[2],
        providerEmail: row[3],
        emailVerified: row[4],
        createdAt: row[5],
        updatedAt: row[6]
    }));
}

