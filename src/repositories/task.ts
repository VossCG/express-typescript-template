import type { Sql } from 'postgres';
import * as taskSql from '../database/sqlc/tasks_sql';
import type { Task } from '../domain/task';
import type { TaskRepository } from '../ports/taskRepository';

type TaskRow =
  | taskSql.ListTasksRow
  | taskSql.GetTaskRow
  | taskSql.CreateTaskRow
  | taskSql.UpdateTaskRow;

const toTask = (row: TaskRow): Task => ({
  id: row.id,
  title: row.title,
  description: row.description,
  completed: row.completed,
  createdAt: row.createdAt,
  updatedAt: row.updatedAt,
});

export const createTaskRepository = (sql: Sql): TaskRepository => ({
  findAll: async () => (await taskSql.listTasks(sql)).map(toTask),

  findById: async (id) => {
    const row = await taskSql.getTask(sql, { id });
    return row ? toTask(row) : null;
  },

  create: async (input) => {
    const row = await taskSql.createTask(sql, input);
    if (!row) throw new Error('Task was not returned after creation');
    return toTask(row);
  },

  update: async (id, patch) => {
    const row = await taskSql.updateTask(sql, {
      id,
      title: patch.title ?? null,
      setDescription: patch.description !== undefined,
      description: patch.description ?? null,
      completed: patch.completed ?? null,
    });
    return row ? toTask(row) : null;
  },

  delete: async (id) => (await taskSql.deleteTask(sql, { id })) !== null,
});
