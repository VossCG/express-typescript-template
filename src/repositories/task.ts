import type { Sql } from 'postgres';
import * as taskSql from '../database/sqlc/tasks_sql';

export interface TaskRepository {
  findAll(): Promise<taskSql.ListTasksRow[]>;
  findById(id: string): Promise<taskSql.GetTaskRow | null>;
  create(input: taskSql.CreateTaskArgs): Promise<taskSql.CreateTaskRow>;
  update(input: taskSql.UpdateTaskArgs): Promise<taskSql.UpdateTaskRow | null>;
  delete(id: string): Promise<void>;
}

export const createTaskRepository = (sql: Sql): TaskRepository => ({
  findAll: () => taskSql.listTasks(sql),

  findById: (id) => taskSql.getTask(sql, { id }),

  create: async (input) => {
    const task = await taskSql.createTask(sql, input);
    if (!task) throw new Error('Task was not returned after creation');
    return task;
  },

  update: (input) => taskSql.updateTask(sql, input),

  delete: (id) => taskSql.deleteTask(sql, { id }),
});
