import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { TaskNotFoundError } from '../src/domain/task';
import type { Task } from '../src/domain/task';
import type { TaskRepository } from '../src/ports/taskRepository';
import { createTaskService } from '../src/services/task';

const task: Task = {
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
  update: async (_id, input) => ({ ...task, ...input }),
  delete: async () => true,
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

  it('passes a partial update directly to the repository without a prior read', async () => {
    let receivedId: string | undefined;
    let receivedInput: Parameters<TaskRepository['update']>[1] | undefined;
    const repository = createFakeRepository({
      findById: async () => {
        throw new Error('Update must not read the task first');
      },
      update: async (id, input) => {
        receivedId = id;
        receivedInput = input;
        return { ...task, ...input };
      },
    });

    await createTaskService(repository).update(task.id, {
      description: null,
      completed: false,
    });

    assert.equal(receivedId, task.id);
    assert.deepEqual(receivedInput, { description: null, completed: false });
  });

  it('throws TaskNotFoundError when reading a missing task', async () => {
    const service = createTaskService(createFakeRepository({ findById: async () => null }));

    await assert.rejects(service.getById(task.id), TaskNotFoundError);
  });

  it('throws TaskNotFoundError when an update affects no task', async () => {
    const missingService = createTaskService(createFakeRepository({ update: async () => null }));

    await assert.rejects(missingService.update(task.id, { title: 'New title' }), TaskNotFoundError);
  });

  it('uses the delete result to report a missing task without a prior read', async () => {
    let deletedId: string | undefined;
    const service = createTaskService(
      createFakeRepository({
        findById: async () => {
          throw new Error('Delete must not read the task first');
        },
        delete: async (id) => {
          deletedId = id;
          return true;
        },
      }),
    );

    await service.delete(task.id);
    assert.equal(deletedId, task.id);

    const missingService = createTaskService(createFakeRepository({ delete: async () => false }));
    await assert.rejects(missingService.delete(task.id), TaskNotFoundError);
  });
});
