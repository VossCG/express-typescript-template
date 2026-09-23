-- name: ListTasks :many
SELECT id, title, description, completed, created_at, updated_at
FROM tasks
ORDER BY created_at DESC;

-- name: GetTask :one
SELECT id, title, description, completed, created_at, updated_at
FROM tasks
WHERE id = $1;

-- name: CreateTask :one
INSERT INTO tasks (title, description)
VALUES ($1, $2)
RETURNING id, title, description, completed, created_at, updated_at;

-- name: UpdateTask :one
UPDATE tasks
SET title = COALESCE(sqlc.narg('title')::text, title),
    description = CASE WHEN sqlc.arg('set_description')::boolean
      THEN sqlc.narg('description')::text ELSE description END,
    completed = COALESCE(sqlc.narg('completed')::boolean, completed),
    updated_at = NOW()
WHERE id = sqlc.arg('id')
RETURNING id, title, description, completed, created_at, updated_at;

-- name: DeleteTask :one
DELETE FROM tasks
WHERE id = $1
RETURNING id;
