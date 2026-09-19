# Backend Quick Start

可重複使用的 REST API 起始模板，內建 Express 5、TypeScript、Zod、PostgreSQL、sqlc、dbmate、Pino、OpenAPI，以及 Google Login + JWT 範例。

## 需求

- Node.js 22+
- Docker 與 Docker Compose
- [sqlc](https://docs.sqlc.dev/en/latest/overview/install.html)

## 快速開始

```bash
npm install
cp .env.sample .env
# 編輯 .env：填入 Google OAuth Client ID 與至少 32 字元的 JWT_SECRET
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
| `npm test` | 編譯並執行 service 與 repository 測試 |
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

模板也提供一套最小、可替換的登入流程：

```text
POST /api/v1/auth/google      以 Google ID token 登入
POST /api/v1/auth/refresh     輪替 refresh token
POST /api/v1/auth/logout      登出目前 session
POST /api/v1/auth/logout-all  撤銷使用者所有 session
GET  /api/v1/auth/me          取得目前使用者
```

`/google` 與 `/refresh` 會在 response body 回傳短效 access token；refresh token 僅存放於 `HttpOnly` cookie。呼叫 `/me` 與 `/logout-all` 時，請使用 `Authorization: Bearer <access-token>`。

這是基礎模板，因此刻意未加入角色權限、帳號合併、前端 Google 按鈕、密碼登入、Redis token denylist 與寄信流程。實際產品應依需求擴充，而不是直接假設這些商業規則。

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
  database/     PostgreSQL 連線與 sqlc 產生的查詢／型別
  helpers/      共用 request 驗證
  mappers/      sqlc query result 與 API response 的轉換
  middleware/   Express middleware
  repositories/ 封裝資料庫存取
  routes/       HTTP routes 與全域 router 組裝
  schemas/      Zod request、response schema
  security/     Google token、JWT 與 auth cookie adapter
  services/     商業規則與應用流程
db/
  migrations/   dbmate migrations
  queries/      sqlc SQL queries
test/            Node.js 內建測試
```

專案依技術職責分層，請求採用以下資料流：

```text
route → service → repository → sqlc → PostgreSQL
```

- `route`：定義 HTTP route、request validation 與 response mapping。
- `service`：實作商業規則，不直接依賴 Express 或 PostgreSQL。
- `repository`：封裝 sqlc 產生的查詢函式。
- `routes/index.ts`：建立 repository、service 與 router，集中組裝依賴。

新增 resource 時，分別在對應的 `schemas`、`repositories`、`services`、`routes` 層加入檔案，並新增 migration 與 query。資料庫輸入／輸出型別直接使用 sqlc 產生的 `Args` 與 `Row`；修改 SQL 後執行 `npm run db:generate`，不要直接修改 `src/database/sqlc` 下的產生碼。

## 環境變數

| 名稱 | 說明 | 預設／範例 |
| --- | --- | --- |
| `NODE_ENV` | 執行環境 | `development` |
| `PORT` | HTTP port | `3000` |
| `CORS_ORIGIN` | 允許的來源 | `*` |
| `DATABASE_URL` | PostgreSQL 連線字串 | 見 `.env.sample` |
| `GOOGLE_CLIENT_ID` | Google OAuth Web Client ID，用來驗證 ID token audience | 必填 |
| `JWT_SECRET` | HS256 簽章密鑰，至少 32 字元 | 必填 |
| `JWT_ISSUER` | JWT issuer | `backend-template` |
| `JWT_AUDIENCE` | JWT audience | `backend-template-web` |
| `JWT_ACCESS_TTL_SECONDS` | access token 有效秒數 | `600` |
| `JWT_REFRESH_TTL_SECONDS` | refresh token／session 有效秒數 | `2592000` |
| `REFRESH_COOKIE_NAME` | refresh cookie 名稱 | `refresh_token` |

Compose 帳密與 `.env.sample` 中的 JWT secret 都僅是本機提示值；部署時請使用 secret manager 產生及保存獨立密鑰。

refresh cookie 預設為 `HttpOnly`、`SameSite=Lax`，production 時開啟 `Secure`，適合同站或同 site 的前後端。若前後端位於不同 site，需改為 `SameSite=None; Secure`，設定明確的 `CORS_ORIGIN`，並另外加入 CSRF 防護；不要搭配萬用字元 origin。
