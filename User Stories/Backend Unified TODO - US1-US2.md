# Backend Unified TODO (User Story 1 + User Story 2)

## Objective
Implement a single backend application that supports:
- US1: Unanswered question detection and listing.
- US2: Notification delivery when unanswered questions become answered.

## Phase 0 — Baseline and Project Setup
- [ ] Confirm single app repo structure under `BackEnd/src`:
  - [ ] `controllers/`
  - [ ] `services/`
  - [ ] `repositories/`
  - [ ] `models/`
  - [ ] `routes/`
  - [ ] `middleware/`
- [ ] Add environment config (`PORT`, `CORS_ORIGIN`, future DB URL).
- [ ] Standardize API prefix and route registration.
- [ ] Add centralized error handler and request logging middleware.

## Phase 1 — Shared Domain Models
- [ ] Define `Message` model.
- [ ] Define `QuestionStatus` model (`unanswered`, `answered`, metadata).
- [ ] Define `Notification` model (`question_answered`, read state).
- [ ] Add DTOs for API responses:
  - [ ] `DetectedQuestionDto`
  - [ ] `NotificationDto`

## Phase 2 — Repositories (Persistence Boundary)
- [ ] Create `MessageRepository` interface and in-memory implementation.
- [ ] Create `QuestionStatusRepository` interface and in-memory implementation.
- [ ] Create `NotificationRepository` interface and in-memory implementation.
- [ ] Add repository tests for CRUD + query behavior.

## Phase 3 — Core Services
- [ ] Implement `QuestionDetectionService`:
  - [ ] identify likely questions
  - [ ] detect unanswered questions by channel
- [ ] Implement `QuestionStatusService`:
  - [ ] evaluate transitions when new messages arrive
  - [ ] update status from unanswered -> answered
- [ ] Implement `NotificationService`:
  - [ ] create notification on answered transition
  - [ ] list notifications by user
  - [ ] mark notification as read

## Phase 4 — API Endpoints
- [ ] US1 endpoints:
  - [ ] `GET /api/questions?channelIds=...`
  - [ ] `GET /api/channels/:channelId/messages`
- [ ] Shared ingestion endpoint:
  - [ ] `POST /api/channels/:channelId/messages` (trigger transition evaluation)
- [ ] US2 endpoints:
  - [ ] `GET /api/notifications?userId=...`
  - [ ] `PATCH /api/notifications/:notificationId/read`
- [ ] Validate all request params/body with schema validation.

## Phase 5 — Security and Privacy
- [ ] Add auth placeholder middleware (user identity extraction).
- [ ] Enforce ownership checks for notifications.
- [ ] Restrict CORS to frontend origin.
- [ ] Sanitize and minimize log payloads.
- [ ] Add rate limiting on write endpoints.

## Phase 6 — Testing and Quality
- [ ] Unit tests for detection logic edge cases.
- [ ] Unit tests for transition + notification creation logic.
- [ ] Integration tests for full flow:
  - [ ] post question -> appears in `/api/questions`
  - [ ] post answer -> removed from unanswered + appears in `/api/notifications`
  - [ ] mark read updates unread state
- [ ] Add test fixtures for realistic channel conversations.

## Phase 7 — Frontend Contract Verification
- [ ] Verify US1 frontend consumes `/api/questions` and thread navigation works.
- [ ] Verify US2 frontend consumes `/api/notifications` and unread badge updates.
- [ ] Document API examples and error codes in backend README.

## Phase 8 — Production Readiness (Post-MVP)
- [ ] Swap in-memory repos for persistent DB implementation.
- [ ] Add migrations for `question_status` and `notifications`.
- [ ] Add background/event processing if message volume grows.
- [ ] Add observability (metrics, traces, alerting).

## Critical Risks to Track
- [ ] False positives/negatives in answer detection quality.
- [ ] Duplicate notifications from repeated transition checks.
- [ ] Data loss risk before persistence is implemented.
- [ ] Contract drift between frontend and backend DTOs.
