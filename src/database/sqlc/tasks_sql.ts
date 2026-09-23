import { Sql } from 'postgres';

export const listTasksQuery = `-- name: ListTasks :many
SELECT id, title, description, completed, created_at, updated_at
FROM tasks
ORDER BY created_at DESC`;

export interface ListTasksRow {
  id: string;
  title: string;
  description: string | null;
  completed: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export async function listTasks(sql: Sql): Promise<ListTasksRow[]> {
  return (await sql.unsafe(listTasksQuery, []).values()).map((row) => ({
    id: row[0],
    title: row[1],
    description: row[2],
    completed: row[3],
    createdAt: row[4],
    updatedAt: row[5],
  }));
}

export const getTaskQuery = `-- name: GetTask :one
SELECT id, title, description, completed, created_at, updated_at
FROM tasks
WHERE id = $1`;

export interface GetTaskArgs {
  id: string;
}

export interface GetTaskRow {
  id: string;
  title: string;
  description: string | null;
  completed: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export async function getTask(sql: Sql, args: GetTaskArgs): Promise<GetTaskRow | null> {
  const rows = await sql.unsafe(getTaskQuery, [args.id]).values();
  if (rows.length !== 1) {
    return null;
  }
  const row = rows[0];
  return {
    id: row[0],
    title: row[1],
    description: row[2],
    completed: row[3],
    createdAt: row[4],
    updatedAt: row[5],
  };
}

export const createTaskQuery = `-- name: CreateTask :one
INSERT INTO tasks (title, description)
VALUES ($1, $2)
RETURNING id, title, description, completed, created_at, updated_at`;

export interface CreateTaskArgs {
  title: string;
  description: string | null;
}

export interface CreateTaskRow {
  id: string;
  title: string;
  description: string | null;
  completed: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export async function createTask(sql: Sql, args: CreateTaskArgs): Promise<CreateTaskRow | null> {
  const rows = await sql.unsafe(createTaskQuery, [args.title, args.description]).values();
  if (rows.length !== 1) {
    return null;
  }
  const row = rows[0];
  return {
    id: row[0],
    title: row[1],
    description: row[2],
    completed: row[3],
    createdAt: row[4],
    updatedAt: row[5],
  };
}

export const updateTaskQuery = `-- name: UpdateTask :one
UPDATE tasks
SET title = COALESCE($1::text, title),
    description = CASE WHEN $2::boolean
      THEN $3::text ELSE description END,
    completed = COALESCE($4::boolean, completed),
    updated_at = NOW()
WHERE id = $5
RETURNING id, title, description, completed, created_at, updated_at`;

export interface UpdateTaskArgs {
  title: string | null;
  setDescription: boolean;
  description: string | null;
  completed: boolean | null;
  id: string;
}

export interface UpdateTaskRow {
  id: string;
  title: string;
  description: string | null;
  completed: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export async function updateTask(sql: Sql, args: UpdateTaskArgs): Promise<UpdateTaskRow | null> {
  const rows = await sql
    .unsafe(updateTaskQuery, [
      args.title,
      args.setDescription,
      args.description,
      args.completed,
      args.id,
    ])
    .values();
  if (rows.length !== 1) {
    return null;
  }
  const row = rows[0];
  return {
    id: row[0],
    title: row[1],
    description: row[2],
    completed: row[3],
    createdAt: row[4],
    updatedAt: row[5],
  };
}

export const deleteTaskQuery = `-- name: DeleteTask :one
DELETE FROM tasks
WHERE id = $1
RETURNING id`;

export interface DeleteTaskArgs {
  id: string;
}

export interface DeleteTaskRow {
  id: string;
}

export async function deleteTask(sql: Sql, args: DeleteTaskArgs): Promise<DeleteTaskRow | null> {
  const rows = await sql.unsafe(deleteTaskQuery, [args.id]).values();
  if (rows.length !== 1) {
    return null;
  }
  const row = rows[0];
  return {
    id: row[0],
  };
}
