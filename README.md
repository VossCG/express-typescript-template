# Express TypeScript PostgreSQL Template

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

A reusable REST API starter template built with Express 5, TypeScript, Zod, PostgreSQL, sqlc, dbmate, Pino, and OpenAPI.

This GitHub Template includes a clear route → controller → service → repository structure and a working Tasks CRUD example.

## Requirements

- Node.js 22+
- Docker with Docker Compose
- [sqlc](https://docs.sqlc.dev/en/latest/overview/install.html)

## Getting started

```bash
git clone https://github.com/VossCG/express-typescript.git
cd express-typescript
npm ci
cp .env.sample .env
docker compose up -d
npm run db:migrate
npm run db:generate
npm run dev
```

The default `DATABASE_URL` points to `localhost:5432/backend_template`. Do not copy `.env.sample` again if `.env` already exists.

Available endpoints:

- API: `http://localhost:3000`
- Health check: `http://localhost:3000/health`
- Swagger UI: `http://localhost:3000/api-docs`

The development command checks that Docker and PostgreSQL are ready before starting the API. Run `npm run db:generate` again after changing SQL queries.

## Docker

Build and run the production API image:

```bash
docker build -t express-typescript .
docker run --rm --env-file .env -p 3000:3000 express-typescript
```

The `compose.yaml` file is intended for local PostgreSQL development. Use a managed database and a secrets manager in production.

## Common commands

| Command | Description |
| --- | --- |
| `npm run dev` | Watch files and start the development server |
| `npm run build` | Compile TypeScript into `dist/` |
| `npm test` | Compile and run HTTP, service, and repository tests |
| `npm run clean` | Remove `dist/` and `build/` output |
| `npm start` | Run the compiled server |
| `npm run db:up` | Start the local PostgreSQL container |
| `npm run db:down` | Stop the local PostgreSQL container |
| `npm run db:migrate` | Apply all database migrations |
| `npm run db:rollback` | Roll back the latest migration |
| `npm run db:status` | Show migration status |
| `npm run db:generate` | Generate TypeScript query code from SQL |

## Example API

```text
GET    /api/v1/tasks
GET    /api/v1/tasks/:id
POST   /api/v1/tasks
PATCH  /api/v1/tasks/:id
DELETE /api/v1/tasks/:id
```

Create a task:

```bash
curl -X POST http://localhost:3000/api/v1/tasks \
  -H 'Content-Type: application/json' \
  -d '{"title":"Create my first endpoint"}'
```

Successful responses use `{ "success": true, "data": {} }`. Errors use `{ "success": false, "error": { "code": "BAD_REQUEST", "message": "Request validation failed" } }`.

## Project structure

```text
src/
  config/       Environment and OpenAPI configuration
  contracts/    Endpoint schemas and OpenAPI metadata
  controllers/  HTTP request and response handling
  core/         Shared errors and response formats
  database/     PostgreSQL connection and generated sqlc code
  helpers/      Shared request validation
  mappers/      Map sqlc results to API responses
  middleware/   Express middleware
  modules/      Assemble feature dependencies
  repositories/ Encapsulate database access
  routes/       HTTP routes and router mounting
  schemas/      Zod request and response schemas
  services/     Business rules and application flows
db/
  migrations/   dbmate migrations
  queries/      sqlc SQL queries
test/           Node.js built-in tests
```

Requests follow this flow:

```text
route → controller → service → repository → sqlc → PostgreSQL
```

When adding a resource, update the relevant `schemas`, `contracts`, `repositories`, `services`, `controllers`, `routes`, and `modules` layers. Add the migration and SQL query, then run `npm run db:generate`. Do not edit generated files under `src/database/sqlc` directly.

## Routes and OpenAPI

OpenAPI metadata is defined with `defineOperation`; validation and the controller stay with the route declaration:

```ts
const createWidgetDocs = defineOperation({
  summary: 'Create a widget',
  body: createWidgetSchema,
  response: widgetSchema,
  status: 201,
  errors: [400, 500],
});

const router = createOpenApiRouter({ tags: ['Widgets'] });
router.post('/', createWidgetDocs, controller.create);
```

Mount a complete base path once:

```ts
mountOpenApiRouter(router, '/api/v1/widgets', widgetRoutes);
```

## Environment variables

| Name | Description | Default / example |
| --- | --- | --- |
| `NODE_ENV` | Runtime environment | `development` |
| `PORT` | HTTP port | `3000` |
| `CORS_ORIGIN` | Allowed origin | `*` |
| `DATABASE_URL` | PostgreSQL connection string | See `.env.sample` |

The credentials in Compose are for local development only. Use separate secure credentials in deployment.

## License

This project is released under the [MIT License](LICENSE).
