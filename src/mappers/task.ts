import type {
  CreateTaskRow,
  GetTaskRow,
  ListTasksRow,
  UpdateTaskRow,
} from '../database/sqlc/tasks_sql';

type TaskRow = ListTasksRow | GetTaskRow | CreateTaskRow | UpdateTaskRow;

export const toTaskResponse = (task: TaskRow) => ({
  ...task,
  createdAt: task.createdAt.toISOString(),
  updatedAt: task.updatedAt.toISOString(),
});
