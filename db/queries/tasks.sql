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
SET title = $2,
    description = $3,
    completed = $4,
    updated_at = NOW()
WHERE id = $1
RETURNING id, title, description, completed, created_at, updated_at;

-- name: DeleteTask :exec
DELETE FROM tasks
WHERE id = $1;
