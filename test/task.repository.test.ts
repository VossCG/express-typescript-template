import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import type { Sql } from 'postgres';

import { createTaskRepository } from '../src/repositories/task';

interface SqlCall {
  query: string;
  parameters: unknown[];
}

const row = [
  '1f547b90-9752-46d2-99f0-b1501518ce4b',
  'Write tests',
  'Cover the repository layer',
  false,
  new Date('2026-09-19T08:00:00.000Z'),
  new Date('2026-09-19T09:00:00.000Z'),
];

const createFakeSql = (rows: unknown[][]) => {
  const calls: SqlCall[] = [];
  const sql = {
    unsafe: (query: string, parameters: unknown[]) => {
      calls.push({ query, parameters });
      return { values: async () => rows };
    },
  } as unknown as Sql;

  return { calls, sql };
};

describe('TaskRepository', () => {
  it('maps task rows returned by sqlc', async () => {
    const fake = createFakeSql([row]);
    const repository = createTaskRepository(fake.sql);

    const tasks = await repository.findAll();

    assert.deepEqual(tasks, [
      {
        id: row[0],
        title: row[1],
        description: row[2],
        completed: row[3],
        createdAt: row[4],
        updatedAt: row[5],
      },
    ]);
    assert.match(fake.calls[0].query, /FROM tasks/);
    assert.deepEqual(fake.calls[0].parameters, []);
  });

  it('passes ids and write data to the generated queries', async () => {
    const findFake = createFakeSql([row]);
    await createTaskRepository(findFake.sql).findById(row[0] as string);
    assert.deepEqual(findFake.calls[0].parameters, [row[0]]);

    const createFake = createFakeSql([row]);
    await createTaskRepository(createFake.sql).create({
      title: row[1] as string,
      description: row[2] as string,
    });
    assert.deepEqual(createFake.calls[0].parameters, [row[1], row[2]]);

    const updateFake = createFakeSql([row]);
    await createTaskRepository(updateFake.sql).update({
      id: row[0] as string,
      title: row[1] as string,
      description: null,
      completed: true,
    });
    assert.deepEqual(updateFake.calls[0].parameters, [row[0], row[1], null, true]);

    const deleteFake = createFakeSql([]);
    await createTaskRepository(deleteFake.sql).delete(row[0] as string);
    assert.deepEqual(deleteFake.calls[0].parameters, [row[0]]);
  });

  it('rejects an insert that does not return a task', async () => {
    const fake = createFakeSql([]);
    const repository = createTaskRepository(fake.sql);

    await assert.rejects(
      repository.create({ title: 'Write tests', description: null }),
      /Task was not returned after creation/,
    );
  });
});
