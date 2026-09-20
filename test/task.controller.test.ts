import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import type { NextFunction, Request, Response } from 'express';

import { createTaskController } from '../src/controllers/task';
import type { TaskService } from '../src/services/task';

const task = {
  id: '1f547b90-9752-46d2-99f0-b1501518ce4b',
  title: 'Write controller tests',
  description: null,
  completed: false,
  createdAt: new Date('2026-09-20T08:00:00.000Z'),
  updatedAt: new Date('2026-09-20T09:00:00.000Z'),
};

const createFakeService = (overrides: Partial<TaskService> = {}): TaskService => ({
  list: async () => [task],
  getById: async () => task,
  create: async () => task,
  update: async () => task,
  delete: async () => undefined,
  ...overrides,
});

const createResponseRecorder = () => {
  const result: {
    status?: number;
    body?: unknown;
    sent?: boolean;
  } = {};
  let response: Response;

  response = {
    status: (status: number) => {
      result.status = status;
      return response;
    },
    json: (body: unknown) => {
      result.body = body;
      return response;
    },
    send: () => {
      result.sent = true;
      return response;
    },
  } as unknown as Response;

  return { response, result };
};

const next = (() => undefined) as NextFunction;

describe('TaskController', () => {
  it('maps service rows into the HTTP success response', async () => {
    const controller = createTaskController(createFakeService());
    const { response, result } = createResponseRecorder();

    await controller.list({} as Request, response, next);

    assert.equal(result.status, 200);
    assert.deepEqual(result.body, {
      success: true,
      data: [
        {
          ...task,
          createdAt: '2026-09-20T08:00:00.000Z',
          updatedAt: '2026-09-20T09:00:00.000Z',
        },
      ],
    });
  });

  it('passes validated input to the service and returns created status', async () => {
    let receivedInput: Parameters<TaskService['create']>[0] | undefined;
    const controller = createTaskController(
      createFakeService({
        create: async (input) => {
          receivedInput = input;
          return task;
        },
      }),
    );
    const { response, result } = createResponseRecorder();
    const request = {
      body: { title: 'Write controller tests', description: null },
    } as Request;

    await controller.create(request, response, next);

    assert.deepEqual(receivedInput, request.body);
    assert.equal(result.status, 201);
  });

  it('returns an empty 204 response after deletion', async () => {
    let deletedId: string | undefined;
    const controller = createTaskController(
      createFakeService({
        delete: async (id) => {
          deletedId = id;
        },
      }),
    );
    const { response, result } = createResponseRecorder();

    await controller.delete({ params: { id: task.id } } as unknown as Request, response, next);

    assert.equal(deletedId, task.id);
    assert.equal(result.status, 204);
    assert.equal(result.sent, true);
  });
});
