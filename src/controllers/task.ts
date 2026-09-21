import { sendSuccess } from '../core/ApiResponse';
import { toTaskResponse } from '../mappers/task';
import type { TaskService } from '../services/task';
import type { RequestHandler } from 'express';
import type { CreateTaskInput, UpdateTaskInput } from '../schemas/task';

export interface TaskController {
  list: RequestHandler;
  create: RequestHandler;
  getById: RequestHandler;
  update: RequestHandler;
  delete: RequestHandler;
}

export const createTaskController = (service: TaskService): TaskController => ({
  list: async (_req, res) => {
    const tasks = await service.list();
    sendSuccess(res, tasks.map(toTaskResponse));
  },

  create: async (req, res) => {
    const task = await service.create(req.body as CreateTaskInput);
    sendSuccess(res, toTaskResponse(task), 201);
  },

  getById: async (req, res) => {
    const task = await service.getById(req.params.id);
    sendSuccess(res, toTaskResponse(task));
  },

  update: async (req, res) => {
    const task = await service.update(req.params.id, req.body as UpdateTaskInput);
    sendSuccess(res, toTaskResponse(task));
  },

  delete: async (req, res) => {
    await service.delete(req.params.id);
    res.status(204).send();
  },
});
