import type { Task } from '../domain/task';

export const toTaskResponse = (task: Task) => ({
  id: task.id,
  title: task.title,
  description: task.description,
  completed: task.completed,
  createdAt: task.createdAt.toISOString(),
  updatedAt: task.updatedAt.toISOString(),
});
