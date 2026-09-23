import type { Sql } from 'postgres';
import * as taskSql from '../database/sqlc/tasks_sql';

export interface TaskPatch {
  title?: string;
  description?: string | null;
  completed?: boolean;
}

export interface TaskRepository {
  findAll(): Promise<taskSql.ListTasksRow[]>;
  findById(id: string): Promise<taskSql.GetTaskRow | null>;
  create(input: taskSql.CreateTaskArgs): Promise<taskSql.CreateTaskRow>;
  update(id: string, patch: TaskPatch): Promise<taskSql.UpdateTaskRow | null>;
  delete(id: string): Promise<boolean>;
}

export const createTaskRepository = (sql: Sql): TaskRepository => ({
  findAll: () => taskSql.listTasks(sql),

  findById: (id) => taskSql.getTask(sql, { id }),

  create: async (input) => {
    const task = await taskSql.createTask(sql, input);
    if (!task) throw new Error('Task was not returned after creation');
    return task;
  },

  update: (id, patch) =>
    taskSql.updateTask(sql, {
      id,
      title: patch.title ?? null,
      setDescription: patch.description !== undefined,
      description: patch.description ?? null,
      completed: patch.completed ?? null,
    }),

  delete: async (id) => (await taskSql.deleteTask(sql, { id })) !== null,
});
