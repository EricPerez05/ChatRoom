# ChatRoom Backend

## Run

```bash
npm install
npm run dev
```

Server runs on `http://localhost:4000` by default.

## Environment

- `PORT` (default: `4000`)
- `CORS_ORIGIN` (default: `http://localhost:5173`)
- `MAX_WRITE_REQUESTS_PER_MINUTE` (default: `60`)
- `PERSISTENCE_MODE` (`memory` | `postgres`, default: `memory`)
- `DATABASE_URL` (required when `PERSISTENCE_MODE=postgres`)

## PostgreSQL Persistence

1. Set env vars:

```bash
PERSISTENCE_MODE=postgres
DATABASE_URL=postgres://<user>:<password>@localhost:5432/chatroom
```

2. Run DB migrations:

```bash
npm run db:migrate
```

3. Start backend:

```bash
npm run dev
```

Migration SQL files are in `migrations/`.

## Endpoints

- `GET /health`
- `GET /api/servers`
- `GET /api/groups`
- `GET /api/members`
- `GET /api/channels/:channelId/messages`
- `POST /api/channels/:channelId/messages`
- `GET /api/questions?channelIds=c1,c2`
- `GET /api/discussions?channelIds=c1,c2`
- `GET /api/notifications?userId=u1`
- `PATCH /api/notifications/:notificationId/read`

## Message Ingestion (US1 + US2)

`POST /api/channels/:channelId/messages` drives unanswered-question transitions and notifications.

Request body:

```json
{
	"userId": "u-you",
	"userName": "You",
	"userAvatar": "👤",
	"content": "Can someone help with question 4?"
}
```

When a non-question reply is posted by another user in the same channel, matching unanswered questions are moved to answered and a `question_answered` notification is created.

`PATCH /api/notifications/:notificationId/read` requires:

- Header: `x-user-id: <owner-user-id>`
- Body: `{ "read": true }`

## Notes

- Supports `memory` and `postgres` persistence modes.
- `memory` mode seeds from `src/data/mockData.ts`.
- `postgres` mode uses durable storage via repository adapters and migrations.
- Structured app layout: `controllers`, `services`, `repositories`, `models`, `routes`, `middleware`.
- Write endpoints include lightweight per-IP rate limiting.
