-- name: CreateUserIdentity :one
INSERT INTO user_identities (
  provider,
  provider_subject,
  user_id,
  provider_email,
  email_verified
)
VALUES (
  LOWER(sqlc.arg(provider)::text),
  sqlc.arg(provider_subject),
  sqlc.arg(user_id),
  LOWER(sqlc.narg(provider_email)::text),
  sqlc.arg(email_verified)
)
RETURNING
  provider,
  provider_subject,
  user_id,
  provider_email,
  email_verified,
  created_at,
  updated_at;

-- name: GetUserIdentity :one
SELECT
  provider,
  provider_subject,
  user_id,
  provider_email,
  email_verified,
  created_at,
  updated_at
FROM user_identities
WHERE provider = LOWER(sqlc.arg(provider)::text)
  AND provider_subject = sqlc.arg(provider_subject);

-- name: GetUserByIdentity :one
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
WHERE user_identities.provider = LOWER(sqlc.arg(provider)::text)
  AND user_identities.provider_subject = sqlc.arg(provider_subject);

-- name: UpdateUserIdentityProfile :one
UPDATE user_identities
SET provider_email = LOWER(sqlc.narg(provider_email)::text),
    email_verified = sqlc.arg(email_verified),
    updated_at = NOW()
WHERE provider = LOWER(sqlc.arg(provider)::text)
  AND provider_subject = sqlc.arg(provider_subject)
RETURNING
  provider,
  provider_subject,
  user_id,
  provider_email,
  email_verified,
  created_at,
  updated_at;

-- name: ListUserIdentities :many
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
ORDER BY created_at ASC;
