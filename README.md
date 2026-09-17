# Backend Quick Start

可重複使用的 REST API 起始模板，內建 Express 5、TypeScript、Zod、PostgreSQL、sqlc、dbmate、Pino 與 OpenAPI。

## 需求

- Node.js 22+
- Docker 與 Docker Compose
- [sqlc](https://docs.sqlc.dev/en/latest/overview/install.html)

## 快速開始

```bash
npm install
cp .env.sample .env
npm run db:up
npm run db:migrate
npm run db:generate
npm run dev
```

啟動後可使用：

- API：`http://localhost:3000`
- 健康檢查：`http://localhost:3000/health`
- Swagger UI：`http://localhost:3000/api-docs`

## 常用指令

| 指令 | 用途 |
| --- | --- |
| `npm run dev` | 監聽檔案並啟動開發伺服器 |
| `npm run build` | 編譯 TypeScript 至 `dist/` |
| `npm start` | 執行編譯後的伺服器 |
| `npm run db:up` | 啟動本機 PostgreSQL |
| `npm run db:down` | 停止本機 PostgreSQL |
| `npm run db:migrate` | 執行所有 migrations |
| `npm run db:rollback` | 回復上一個 migration |
| `npm run db:status` | 查看 migration 狀態 |
| `npm run db:generate` | 由 SQL 重新產生 TypeScript 查詢函式 |

## 範例 API

模板提供完整的 Tasks CRUD，可作為建立新 resource 的參考：

```text
GET    /api/v1/tasks
GET    /api/v1/tasks/:id
POST   /api/v1/tasks
PATCH  /api/v1/tasks/:id
DELETE /api/v1/tasks/:id
```

建立 Task：

```bash
curl -X POST http://localhost:3000/api/v1/tasks \
  -H 'Content-Type: application/json' \
  -d '{"title":"Create my first endpoint"}'
```

成功回應統一為：

```json
{
  "success": true,
  "data": {}
}
```

錯誤回應統一為：

```json
{
  "success": false,
  "error": {
    "code": "BAD_REQUEST",
    "message": "Request validation failed"
  }
}
```

## 專案結構

```text
src/
  config/       環境變數與 OpenAPI 設定
  core/         共用錯誤與回應格式
  database/     PostgreSQL 連線與 sqlc 產生碼
  helpers/      共用 request 驗證
  middleware/   Express middleware
  routes/       API resources
db/
  migrations/   dbmate migrations
  queries/      sqlc SQL queries
```

新增 resource 時，依序加入 migration、query、Zod schema 與 route；修改 SQL 後執行 `npm run db:generate`。

## 環境變數

| 名稱 | 說明 | 預設／範例 |
| --- | --- | --- |
| `NODE_ENV` | 執行環境 | `development` |
| `PORT` | HTTP port | `3000` |
| `CORS_ORIGIN` | 允許的來源 | `*` |
| `DATABASE_URL` | PostgreSQL 連線字串 | 見 `.env.sample` |

Compose 中的帳密僅供本機開發；部署時請使用安全的獨立設定。
