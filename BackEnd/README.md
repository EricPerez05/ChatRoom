# ChatRoom Backend

This README is an operations guide for site reliability engineers supporting the backend service for User Story 1 + User Story 2.

## 1) External Dependencies

### Runtime dependencies (required unless marked optional)
- `Node.js` 20+ (required): runtime for the backend process.
- `npm` 10+ (required): package manager for install/build/test/start scripts.
- `express` (required): HTTP server and routing framework.
- `cors` (required): cross-origin policy handling for frontend-to-backend calls.
- `pg` (optional at runtime): PostgreSQL driver, required only when `PERSISTENCE_MODE=postgres`.
- PostgreSQL 15+ server (optional but recommended for durability): persistent storage backend.

### Build/dev/test dependencies
- `typescript` (required for build): compiles `src/` TypeScript to `dist/`.
- `tsx` (required for local dev/migrations): runs TypeScript directly for `npm run dev` and `npm run db:migrate`.
- `vitest` + `supertest` (required for tests): unit/integration test framework + HTTP API testing.

### External services
- No mandatory external SaaS/service dependencies.
- Optional external service: PostgreSQL instance (local, containerized, or managed).

## 2) Datastores This Module Uses

### In-memory datastore (`PERSISTENCE_MODE=memory`)
- Source seed data from `src/data/mockData.ts`.
- Read/write during process lifetime only.
- Data is lost on process restart.

### PostgreSQL datastore (`PERSISTENCE_MODE=postgres`)
- Database created/provisioned outside the app (DBA/SRE responsibility).
- App creates and migrates schema via SQL in `migrations/001_init.sql`.
- App reads/writes these tables:
  - `messages`
  - `question_status`
  - `discussion_state_override`
  - `notifications`

## 3) Environment Configuration

- `PORT` (default: `4000`)
- `CORS_ORIGIN` (default: `http://localhost:5173`)
- `MAX_WRITE_REQUESTS_PER_MINUTE` (default: `60`)
- `PERSISTENCE_MODE` (`memory` or `postgres`, default: `memory`)
- `DATABASE_URL` (required when `PERSISTENCE_MODE=postgres`)
- `LLM_PROVIDER` (`template` or `ollama`, default: `template`)
- `OLLAMA_BASE_URL` (default: `http://localhost:11434`)
- `OLLAMA_MODEL` (default: `llama3.1`)

Example Postgres mode environment:

```bash
PERSISTENCE_MODE=postgres
DATABASE_URL=postgres://<user>:<password>@localhost:5432/chatroom
PORT=4000
CORS_ORIGIN=http://localhost:5173
MAX_WRITE_REQUESTS_PER_MINUTE=60
```

For local development, you can copy the sample file and set values in `BackEnd/.env`:

```bash
cp .env.example .env
```

## 4) Install and Build

From `BackEnd/`:

```bash
npm install
npm run build
```

## 5) Startup Procedures

### Development startup

```bash
npm run dev
```

### Production-like startup

```bash
npm run build
npm run start
```

### PostgreSQL startup sequence
1. Ensure PostgreSQL is reachable with `DATABASE_URL`.
2. Set `PERSISTENCE_MODE=postgres` and `DATABASE_URL`.
3. Run migrations:

```bash
npm run db:migrate
```

4. Start service (`npm run dev` or `npm run start`).

## 6) Stop Procedures

### Foreground process
- Press `Ctrl+C` in the terminal running the backend.

### If process is detached/backgrounded
- Stop by process manager (for example, `pm2 stop <name>` or service unit stop command).
- This repository does not include PM2/systemd manifests; use your environment standard.

## 7) Reset Procedures (Service + Data)

### A) Reset service state only
- Stop service.
- Restart service.
- In `memory` mode this fully resets backend data state.

### B) Reset PostgreSQL data (destructive)
Use this only for non-production environments.

1. Stop backend service.
2. Connect to PostgreSQL and clear module tables:

```sql
TRUNCATE TABLE notifications, discussion_state_override, question_status, messages RESTART IDENTITY CASCADE;
```

3. Re-run migrations if schema was dropped:

```bash
npm run db:migrate
```

4. Start backend again.

### C) Full local clean reset (dependencies + build + data)
1. Stop backend process.
2. Remove generated artifacts (`dist/`) and reinstall dependencies:

PowerShell:

```powershell
Remove-Item -Recurse -Force dist, node_modules
npm install
```

Bash:

```bash
rm -rf dist node_modules
npm install
```

3. Reset Postgres data if using `postgres` mode (steps above).
4. Start backend.

## 8) Operational API Surface

- `GET /health`
- `GET /api/servers`
- `GET /api/groups`
- `GET /api/members`
- `GET /api/channels/:channelId/messages`
- `POST /api/channels/:channelId/messages`
- `GET /api/questions?channelIds=c1,c2`
- `PATCH /api/questions/:questionId/answered`
- `GET /api/discussions?channelIds=c1,c2`
- `PATCH /api/discussions/:discussionId/status`
- `GET /api/notifications?userId=u1`
- `PATCH /api/notifications/:notificationId/read`

## 9) Message/Notification Flow (US1 + US2)

`POST /api/channels/:channelId/messages` is the canonical write path.

- If message is a likely question, backend tracks it as `unanswered`.
- If another user posts a non-question reply in that channel, backend transitions matching questions to `answered` and creates `question_answered` notifications.

`PATCH /api/notifications/:notificationId/read` requires:
- Header: `x-user-id: <owner-user-id>`
- Body: `{ "read": true }`

## 10) Repository Notes

- Source layout: `controllers`, `services`, `repositories`, `models`, `routes`, `middleware`, `db`.
- Write endpoints are rate-limited per-IP.
- Migration files are under `migrations/`.
