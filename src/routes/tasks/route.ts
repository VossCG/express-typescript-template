import { Router } from 'express';
import { z } from 'zod';

import { NotFoundError } from '../../core/ApiError';
import { sendSuccess } from '../../core/ApiResponse';
import { sql } from '../../database';
import {
  createTask,
  deleteTask,
  getTask,
  listTasks,
  updateTask,
} from '../../database/sqlc/tasks_sql';
import { route } from '../../helpers/routeDecorator';
import { validate } from '../../helpers/validator';
import {
  CreateTaskInput,
  UpdateTaskInput,
  createTaskSchema,
  taskIdParamsSchema,
  taskSchema,
  updateTaskSchema,
} from './schema';

const router = Router();

type TaskRow = {
  id: string;
  title: string;
  description: string | null;
  completed: boolean;
  createdAt: Date;
  updatedAt: Date;
};

const serializeTask = (task: TaskRow) => ({
  ...task,
  createdAt: task.createdAt.toISOString(),
  updatedAt: task.updatedAt.toISOString(),
});

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

router.get('/', async (_req, res) => {
  const tasks = await listTasks(sql);
  return sendSuccess(res, tasks.map(serializeTask));
});

router.post('/', validate(createTaskSchema), async (req, res) => {
  const input = req.body as CreateTaskInput;
  const task = await createTask(sql, {
    title: input.title,
    description: input.description ?? null,
  });

  if (!task) throw new Error('Task was not returned after creation');
  return sendSuccess(res, serializeTask(task), 201);
});

router.get('/:id', validate(taskIdParamsSchema, 'params'), async (req, res) => {
  const task = await getTask(sql, { id: req.params.id });
  if (!task) throw new NotFoundError('Task not found');
  return sendSuccess(res, serializeTask(task));
});

router.patch(
  '/:id',
  validate(taskIdParamsSchema, 'params'),
  validate(updateTaskSchema),
  async (req, res) => {
    const input = req.body as UpdateTaskInput;
    const current = await getTask(sql, { id: req.params.id });
    if (!current) throw new NotFoundError('Task not found');

    const task = await updateTask(sql, {
      id: current.id,
      title: input.title ?? current.title,
      description:
        input.description === undefined
          ? current.description
          : input.description,
      completed: input.completed ?? current.completed,
    });

    if (!task) throw new NotFoundError('Task not found');
    return sendSuccess(res, serializeTask(task));
  },
);

router.delete(
  '/:id',
  validate(taskIdParamsSchema, 'params'),
  async (req, res) => {
    const task = await getTask(sql, { id: req.params.id });
    if (!task) throw new NotFoundError('Task not found');

    await deleteTask(sql, { id: task.id });
    res.status(204).send();
  },
);

export default router;
