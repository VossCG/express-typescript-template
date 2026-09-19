-- name: CreateUser :one
INSERT INTO users (
  email,
  display_name,
  avatar_url,
  last_login_at
)
VALUES (
  LOWER(sqlc.arg(email)::text),
  sqlc.narg(display_name),
  sqlc.narg(avatar_url),
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
  updated_at;

-- name: GetUserById :one
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
WHERE id = $1;

-- name: GetUserByEmail :one
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
WHERE LOWER(email) = LOWER(sqlc.arg(email)::text);

-- name: UpdateUserLoginProfile :one
UPDATE users
SET display_name = COALESCE(sqlc.narg(display_name), display_name),
    avatar_url = COALESCE(sqlc.narg(avatar_url), avatar_url),
    last_login_at = NOW(),
    updated_at = NOW()
WHERE id = sqlc.arg(user_id)
RETURNING
  id,
  email,
  display_name,
  avatar_url,
  status,
  last_login_at,
  created_at,
  updated_at;

-- name: UpdateUserStatus :one
UPDATE users
SET status = sqlc.arg(status),
    updated_at = NOW()
WHERE id = sqlc.arg(user_id)
RETURNING
  id,
  email,
  display_name,
  avatar_url,
  status,
  last_login_at,
  created_at,
  updated_at;
