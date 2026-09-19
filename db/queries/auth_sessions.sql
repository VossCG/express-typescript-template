-- name: CreateAuthSession :one
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
  ip_address;

-- name: GetActiveAuthSession :one
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
  AND expires_at > NOW();

-- name: RotateAuthSessionRefreshToken :one
UPDATE auth_sessions
SET current_refresh_jti = sqlc.arg(new_refresh_jti),
    last_used_at = NOW(),
    updated_at = NOW()
WHERE id = sqlc.arg(session_id)
  AND current_refresh_jti = sqlc.arg(current_refresh_jti)
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
  ip_address;

-- name: RevokeAuthSession :one
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
  ip_address;

-- name: RevokeAllUserAuthSessions :many
UPDATE auth_sessions
SET revoked_at = COALESCE(revoked_at, NOW()),
    updated_at = NOW()
WHERE user_id = $1
  AND revoked_at IS NULL
RETURNING id;

-- name: ListActiveUserAuthSessions :many
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
ORDER BY created_at DESC;

-- name: DeleteExpiredAuthSessions :exec
DELETE FROM auth_sessions
WHERE expires_at <= NOW();
