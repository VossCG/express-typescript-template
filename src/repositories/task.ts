import type { Sql } from 'postgres';
import type {
  CreateTaskArgs,
  CreateTaskRow,
  GetTaskRow,
  ListTasksRow,
  UpdateTaskArgs,
  UpdateTaskRow,
} from '../database/sqlc/tasks_sql';
import { createTask, deleteTask, getTask, listTasks, updateTask } from '../database/sqlc/tasks_sql';

export interface TaskRepository {
  findAll(): Promise<ListTasksRow[]>;
  findById(id: string): Promise<GetTaskRow | null>;
  create(input: CreateTaskArgs): Promise<CreateTaskRow>;
  update(input: UpdateTaskArgs): Promise<UpdateTaskRow | null>;
  delete(id: string): Promise<void>;
}

export const createTaskRepository = (sql: Sql): TaskRepository => ({
  findAll: () => listTasks(sql),

  findById: (id) => getTask(sql, { id }),

  create: async (input) => {
    const task = await createTask(sql, input);
    if (!task) throw new Error('Task was not returned after creation');
    return task;
  },

  update: (input) => updateTask(sql, input),

  delete: (id) => deleteTask(sql, { id }),
});
