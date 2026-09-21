import type * as TaskSql from '../database/sqlc/tasks_sql';

type TaskRow =
  | TaskSql.ListTasksRow
  | TaskSql.GetTaskRow
  | TaskSql.CreateTaskRow
  | TaskSql.UpdateTaskRow;

export const toTaskResponse = (task: TaskRow) => ({
  ...task,
  createdAt: task.createdAt.toISOString(),
  updatedAt: task.updatedAt.toISOString(),
});
