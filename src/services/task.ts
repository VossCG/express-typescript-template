import * as TaskDomain from '../domain/task';
import type { TaskRepository } from '../ports/taskRepository';

export interface TaskService {
  list(): Promise<TaskDomain.Task[]>;
  getById(id: string): Promise<TaskDomain.Task>;
  create(input: TaskDomain.CreateTaskInput): Promise<TaskDomain.Task>;
  update(id: string, input: TaskDomain.UpdateTaskInput): Promise<TaskDomain.Task>;
  delete(id: string): Promise<void>;
}

export const createTaskService = (repository: TaskRepository): TaskService => ({
  list: () => repository.findAll(),

  getById: async (id) => {
    const task = await repository.findById(id);
    if (!task) throw new TaskDomain.TaskNotFoundError();
    return task;
  },

  create: (input) =>
    repository.create({
      title: input.title,
      description: input.description ?? null,
    }),

  update: async (id, input) => {
    const task = await repository.update(id, input);

    if (!task) throw new TaskDomain.TaskNotFoundError();
    return task;
  },

  delete: async (id) => {
    const deleted = await repository.delete(id);
    if (!deleted) throw new TaskDomain.TaskNotFoundError();
  },
});
