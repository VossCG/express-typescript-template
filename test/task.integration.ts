// Run with npm run test:integration against a disposable PostgreSQL database.
import assert from 'node:assert/strict';
import { after, describe, it } from 'node:test';

import request from 'supertest';

import app from '../src/app';
import * as db from '../src/database';

after(() => db.close());

describe('Tasks with PostgreSQL', () => {
  it('applies migrations and completes the HTTP CRUD flow', async () => {
    const migrations = await db.sql`
      SELECT version FROM schema_migrations WHERE version = '20260917000000'
    `;
    assert.equal(migrations.length, 1);

    const created = await request(app)
      .post('/api/v1/tasks')
      .send({ title: 'Integration task', description: 'Original description' });
    assert.equal(created.status, 201);
    const id = created.body.data.id as string;
    assert.match(id, /^[0-9a-f-]{36}$/i);

    const fetched = await request(app).get(`/api/v1/tasks/${id}`);
    assert.equal(fetched.status, 200);
    assert.equal(fetched.body.data.description, 'Original description');

    const renamed = await request(app)
      .patch(`/api/v1/tasks/${id}`)
      .send({ title: 'Renamed task' });
    assert.equal(renamed.status, 200);
    assert.equal(renamed.body.data.description, 'Original description');

    const updated = await request(app)
      .patch(`/api/v1/tasks/${id}`)
      .send({ description: null, completed: true });
    assert.equal(updated.status, 200);
    assert.equal(updated.body.data.title, 'Renamed task');
    assert.equal(updated.body.data.description, null);
    assert.equal(updated.body.data.completed, true);

    const listed = await request(app).get('/api/v1/tasks');
    assert.equal(listed.status, 200);
    assert.ok(Array.isArray(listed.body.data));
    assert.ok(listed.body.data.some((task: { id: string }) => task.id === id));

    const deleted = await request(app).delete(`/api/v1/tasks/${id}`);
    assert.equal(deleted.status, 204);
    assert.equal((await request(app).get(`/api/v1/tasks/${id}`)).status, 404);
    assert.equal((await request(app).delete(`/api/v1/tasks/${id}`)).status, 404);
  });
});
