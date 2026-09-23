import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import request from 'supertest';
import express from 'express';

import app from '../src/app';
import { TaskNotFoundError } from '../src/domain/task';
import { error } from '../src/middleware/errorHandler';
import { generateOpenApiDocument } from '../src/swagger';

describe('HTTP application', () => {
  it('serves the health endpoint with the standard success envelope', async () => {
    const response = await request(app).get('/health');

    assert.equal(response.status, 200);
    assert.equal(response.body.success, true);
    assert.equal(response.body.data.status, 'ok');
  });

  it('returns a standard not-found response for unknown routes', async () => {
    const response = await request(app).get('/does-not-exist');

    assert.equal(response.status, 404);
    assert.equal(response.body.success, false);
    assert.equal(response.body.error.code, 'NOT_FOUND');
  });

  it('serves the OpenAPI documentation', async () => {
    const response = await request(app).get('/api-docs/');

    assert.equal(response.status, 200);
    assert.match(response.headers['content-type'], /text\/html/);
    assert.ok(generateOpenApiDocument().paths['/health/ready']?.get?.responses['503']);
  });

  it('rejects invalid task input before reaching the database', async () => {
    const response = await request(app).post('/api/v1/tasks').send({ title: '' });

    assert.equal(response.status, 400);
    assert.equal(response.body.success, false);
    assert.equal(response.body.error.code, 'BAD_REQUEST');
  });

  it('maps a missing task from the service to the standard 404 response', async () => {
    const testApp = express();
    testApp.get('/task', () => {
      throw new TaskNotFoundError();
    });
    testApp.use(error);

    const response = await request(testApp).get('/task');

    assert.equal(response.status, 404);
    assert.deepEqual(response.body, {
      success: false,
      error: { code: 'NOT_FOUND', message: 'Task not found' },
    });
  });
});
