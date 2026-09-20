import { z } from 'zod';

import { defineOperation } from '../helpers/openApiRouter';
import {
  createTaskSchema,
  taskIdParamsSchema,
  taskSchema,
  updateTaskSchema,
} from '../schemas/task';

export const taskDocs = {
  list: defineOperation({
    summary: 'List tasks',
    response: z.array(taskSchema),
    errors: [500],
  }),

  create: defineOperation({
    summary: 'Create a task',
    body: createTaskSchema,
    response: taskSchema,
    status: 201,
    errors: [400, 500],
  }),

  getById: defineOperation({
    summary: 'Get a task',
    params: taskIdParamsSchema,
    response: taskSchema,
    errors: [400, 404, 500],
  }),

  update: defineOperation({
    summary: 'Update a task',
    params: taskIdParamsSchema,
    body: updateTaskSchema,
    response: taskSchema,
    errors: [400, 404, 500],
  }),

  delete: defineOperation({
    summary: 'Delete a task',
    params: taskIdParamsSchema,
    status: 204,
    errors: [400, 404, 500],
  }),
};
