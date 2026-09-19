-- migrate:up

CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  display_name TEXT,
  avatar_url TEXT,
  status TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'suspended', 'disabled')),
  last_login_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX users_email_unique_idx ON users (LOWER(email));

CREATE TABLE user_identities (
  provider TEXT NOT NULL
    CHECK (provider = LOWER(provider) AND char_length(trim(provider)) > 0),
  provider_subject TEXT NOT NULL
    CHECK (char_length(trim(provider_subject)) > 0),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  provider_email TEXT,
  email_verified BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (provider, provider_subject),
  UNIQUE (user_id, provider)
);

CREATE TABLE auth_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  current_refresh_jti UUID NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  revoked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_used_at TIMESTAMPTZ,
  user_agent TEXT,
  ip_address INET,
  CHECK (expires_at > created_at)
);

CREATE INDEX auth_sessions_user_id_idx ON auth_sessions (user_id);
CREATE INDEX auth_sessions_expires_at_idx ON auth_sessions (expires_at);
CREATE INDEX auth_sessions_active_idx
  ON auth_sessions (user_id, expires_at)
  WHERE revoked_at IS NULL;

-- migrate:down

DROP TABLE IF EXISTS auth_sessions;
DROP TABLE IF EXISTS user_identities;
DROP TABLE IF EXISTS users;
