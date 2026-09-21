import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { NotFoundError } from '../src/core/ApiError';
import type * as TaskSql from '../src/database/sqlc/tasks_sql';
import type { TaskRepository } from '../src/repositories/task';
import { createTaskService } from '../src/services/task';

const task: TaskSql.GetTaskRow = {
  id: '1f547b90-9752-46d2-99f0-b1501518ce4b',
  title: 'Write tests',
  description: 'Cover the service layer',
  completed: true,
  createdAt: new Date('2026-09-19T08:00:00.000Z'),
  updatedAt: new Date('2026-09-19T09:00:00.000Z'),
};

const createFakeRepository = (overrides: Partial<TaskRepository> = {}): TaskRepository => ({
  findAll: async () => [task],
  findById: async () => task,
  create: async (input) => ({ ...task, ...input }),
  update: async (input) => ({ ...task, ...input }),
  delete: async () => undefined,
  ...overrides,
});

describe('TaskService', () => {
  it('lists tasks and gets a task by id', async () => {
    const service = createTaskService(createFakeRepository());

    assert.deepEqual(await service.list(), [task]);
    assert.deepEqual(await service.getById(task.id), task);
  });

  it('normalizes an omitted description when creating a task', async () => {
    let receivedInput: Parameters<TaskRepository['create']>[0] | undefined;
    const repository = createFakeRepository({
      create: async (input) => {
        receivedInput = input;
        return { ...task, ...input };
      },
    });

    const result = await createTaskService(repository).create({
      title: 'Write tests',
    });

    assert.deepEqual(receivedInput, {
      title: 'Write tests',
      description: null,
    });
    assert.equal(result.description, null);
  });

  it('merges a partial update without losing false or null values', async () => {
    let receivedInput: Parameters<TaskRepository['update']>[0] | undefined;
    const repository = createFakeRepository({
      update: async (input) => {
        receivedInput = input;
        return { ...task, ...input };
      },
    });

    await createTaskService(repository).update(task.id, {
      description: null,
      completed: false,
    });

    assert.deepEqual(receivedInput, {
      id: task.id,
      title: task.title,
      description: null,
      completed: false,
    });
  });

  it('throws NotFoundError when reading a missing task', async () => {
    const service = createTaskService(createFakeRepository({ findById: async () => null }));

    await assert.rejects(service.getById(task.id), NotFoundError);
  });

  it('throws NotFoundError when updating a missing or concurrently deleted task', async () => {
    const missingService = createTaskService(createFakeRepository({ findById: async () => null }));
    const deletedService = createTaskService(createFakeRepository({ update: async () => null }));

    await assert.rejects(missingService.update(task.id, { title: 'New title' }), NotFoundError);
    await assert.rejects(deletedService.update(task.id, { title: 'New title' }), NotFoundError);
  });

  it('checks existence before deleting and rejects a missing task', async () => {
    let deletedId: string | undefined;
    const service = createTaskService(
      createFakeRepository({
        delete: async (id) => {
          deletedId = id;
        },
      }),
    );

    await service.delete(task.id);
    assert.equal(deletedId, task.id);

    const missingService = createTaskService(createFakeRepository({ findById: async () => null }));
    await assert.rejects(missingService.delete(task.id), NotFoundError);
  });
});
