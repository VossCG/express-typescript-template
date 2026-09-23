import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import express from 'express';
import request from 'supertest';

import { createHealthController } from '../src/controllers/health';
import { error } from '../src/middleware/errorHandler';

const createHealthApp = (checkDatabase: () => Promise<void>) => {
  const app = express();
  const controller = createHealthController(checkDatabase);
  app.get('/health', controller.check);
  app.get('/health/ready', controller.ready);
  app.use(error);
  return app;
};

describe('Health endpoints', () => {
  it('reports liveness without checking the database', async () => {
    const app = createHealthApp(async () => {
      throw new Error('Database is down');
    });

    const response = await request(app).get('/health');

    assert.equal(response.status, 200);
    assert.equal(response.body.data.status, 'ok');
  });

  it('reports readiness when the database check succeeds', async () => {
    let checked = false;
    const app = createHealthApp(async () => {
      checked = true;
    });

    const response = await request(app).get('/health/ready');

    assert.equal(checked, true);
    assert.equal(response.status, 200);
    assert.deepEqual(response.body, { success: true, data: { status: 'ready' } });
  });

  it('returns 503 without exposing database details when the check fails', async () => {
    const app = createHealthApp(async () => {
      throw new Error('Connection password is invalid');
    });

    const response = await request(app).get('/health/ready');

    assert.equal(response.status, 503);
    assert.deepEqual(response.body, {
      success: false,
      error: { code: 'SERVICE_UNAVAILABLE', message: 'Database unavailable' },
    });
  });
});
