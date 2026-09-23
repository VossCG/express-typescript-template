import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { parseEnv } from '../src/config/env';

const databaseUrl = 'postgresql://postgres:postgres@localhost:5432/backend_template';

describe('Environment configuration', () => {
  it('requires an explicit CORS policy in production', () => {
    assert.throws(
      () => parseEnv({ NODE_ENV: 'production', DATABASE_URL: databaseUrl }),
      /CORS_ORIGIN: Set a specific origin or none in production/,
    );
    assert.throws(
      () => parseEnv({ NODE_ENV: 'production', DATABASE_URL: databaseUrl, CORS_ORIGIN: '*' }),
      /CORS_ORIGIN: Set a specific origin or none in production/,
    );
  });

  it('accepts an exact browser origin or disables CORS', () => {
    assert.equal(
      parseEnv({
        NODE_ENV: 'production',
        DATABASE_URL: databaseUrl,
        CORS_ORIGIN: 'https://app.example.com',
      }).CORS_ORIGIN,
      'https://app.example.com',
    );
    assert.equal(
      parseEnv({ NODE_ENV: 'production', DATABASE_URL: databaseUrl, CORS_ORIGIN: 'none' })
        .CORS_ORIGIN,
      'none',
    );
    assert.throws(
      () =>
        parseEnv({
          NODE_ENV: 'production',
          DATABASE_URL: databaseUrl,
          CORS_ORIGIN: 'https://app.example.com/path',
        }),
      /CORS_ORIGIN: Use an HTTP origin/,
    );
  });
});
