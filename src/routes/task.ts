import { Router } from 'express';
import { z } from 'zod';

import { sendSuccess } from '../core/ApiResponse';
import { route } from '../helpers/routeDecorator';
import { validate } from '../helpers/validator';
import { toTaskResponse } from '../mappers/task';
import {
  createTaskSchema,
  taskIdParamsSchema,
  taskSchema,
  updateTaskSchema,
} from '../schemas/task';
import type { CreateTaskInput, UpdateTaskInput } from '../schemas/task';
import type { TaskService } from '../services/task';

route({
  method: 'get',
  path: '/api/v1/tasks',
  tags: ['Tasks'],
  summary: 'List tasks',
  responseSchema: z.array(taskSchema),
  responseDescription: 'Task list',
  errorStatuses: [500],
});

route({
  method: 'post',
  path: '/api/v1/tasks',
  tags: ['Tasks'],
  summary: 'Create a task',
  requestSchema: createTaskSchema,
  responseSchema: taskSchema,
  responseStatus: 201,
  responseDescription: 'Task created',
  errorStatuses: [400, 500],
});

route({
  method: 'get',
  path: '/api/v1/tasks/{id}',
  tags: ['Tasks'],
  summary: 'Get a task',
  params: taskIdParamsSchema,
  responseSchema: taskSchema,
  responseDescription: 'Task details',
  errorStatuses: [400, 404, 500],
});

route({
  method: 'patch',
  path: '/api/v1/tasks/{id}',
  tags: ['Tasks'],
  summary: 'Update a task',
  params: taskIdParamsSchema,
  requestSchema: updateTaskSchema,
  responseSchema: taskSchema,
  responseDescription: 'Task updated',
  errorStatuses: [400, 404, 500],
});

route({
  method: 'delete',
  path: '/api/v1/tasks/{id}',
  tags: ['Tasks'],
  summary: 'Delete a task',
  params: taskIdParamsSchema,
  responseStatus: 204,
  responseDescription: 'Task deleted',
  errorStatuses: [400, 404, 500],
});

export const createTaskRouter = (service: TaskService): Router => {
  const router = Router();

  router.get('/', async (_req, res) => {
    const tasks = await service.list();
    return sendSuccess(res, tasks.map(toTaskResponse));
  });

  router.post('/', validate(createTaskSchema), async (req, res) => {
    const task = await service.create(req.body as CreateTaskInput);
    return sendSuccess(res, toTaskResponse(task), 201);
  });

  router.get(
    '/:id',
    validate(taskIdParamsSchema, 'params'),
    async (req, res) => {
      const task = await service.getById(req.params.id);
      return sendSuccess(res, toTaskResponse(task));
    },
  );

  router.patch(
    '/:id',
    validate(taskIdParamsSchema, 'params'),
    validate(updateTaskSchema),
    async (req, res) => {
      const task = await service.update(
        req.params.id,
        req.body as UpdateTaskInput,
      );
      return sendSuccess(res, toTaskResponse(task));
    },
  );

  router.delete(
    '/:id',
    validate(taskIdParamsSchema, 'params'),
    async (req, res) => {
      await service.delete(req.params.id);
      res.status(204).send();
    },
  );

  return router;
};
