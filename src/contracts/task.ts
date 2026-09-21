import { z } from 'zod';
import { defineOperation } from '../helpers/openApiRouter';
import * as taskSchemas from '../schemas/task';

export const taskDocs = {
  list: defineOperation({
    summary: 'List tasks',
    response: z.array(taskSchemas.taskSchema),
    errors: [500],
  }),

  create: defineOperation({
    summary: 'Create a task',
    body: taskSchemas.createTaskSchema,
    response: taskSchemas.taskSchema,
    status: 201,
    errors: [400, 500],
  }),

  getById: defineOperation({
    summary: 'Get a task',
    params: taskSchemas.taskIdParamsSchema,
    response: taskSchemas.taskSchema,
    errors: [400, 404, 500],
  }),

  update: defineOperation({
    summary: 'Update a task',
    params: taskSchemas.taskIdParamsSchema,
    body: taskSchemas.updateTaskSchema,
    response: taskSchemas.taskSchema,
    errors: [400, 404, 500],
  }),

  delete: defineOperation({
    summary: 'Delete a task',
    params: taskSchemas.taskIdParamsSchema,
    status: 204,
    errors: [400, 404, 500],
  }),
};
