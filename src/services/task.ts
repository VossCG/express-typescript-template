import { NotFoundError } from '../core/ApiError';
import type { TaskRepository } from '../repositories/task';
import type * as TaskSql from '../database/sqlc/tasks_sql';
import type * as TaskSchemas from '../schemas/task';

export interface TaskService {
  list(): Promise<TaskSql.ListTasksRow[]>;
  getById(id: string): Promise<TaskSql.GetTaskRow>;
  create(input: TaskSchemas.CreateTaskInput): Promise<TaskSql.CreateTaskRow>;
  update(id: string, input: TaskSchemas.UpdateTaskInput): Promise<TaskSql.UpdateTaskRow>;
  delete(id: string): Promise<void>;
}

export const createTaskService = (repository: TaskRepository): TaskService => ({
  list: () => repository.findAll(),

  getById: async (id) => {
    const task = await repository.findById(id);
    if (!task) throw new NotFoundError('Task not found');
    return task;
  },

  create: (input) =>
    repository.create({
      title: input.title,
      description: input.description ?? null,
    }),

  update: async (id, input) => {
    const current = await repository.findById(id);
    if (!current) throw new NotFoundError('Task not found');

    const task = await repository.update({
      id: current.id,
      title: input.title ?? current.title,
      description: input.description === undefined ? current.description : input.description,
      completed: input.completed ?? current.completed,
    });

    if (!task) throw new NotFoundError('Task not found');
    return task;
  },

  delete: async (id) => {
    const task = await repository.findById(id);
    if (!task) throw new NotFoundError('Task not found');
    await repository.delete(task.id);
  },
});
