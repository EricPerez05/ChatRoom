# ChatRoom Slide Deck Prompt + Project Facts

## Prompt to use with another AI

You are a slide-deck generator. Create a slide deck in Google Slides, PowerPoint, or PDF format that satisfies the requirements below. All slides must be generated using LLMs and refined only through prompting (no manual edits beyond prompt iteration). Use concise bullets, clear visuals, and include diagrams where required. Target 10-14 slides.

Required slides and content:
1) Title slide: team name, app name, team members.
2) App overview: problem statement, target user.
3) Demo roadmap: 4-6 demo steps with what to show.
4) CI/CD overview with diagrams and workflow charts (show CI on PR/push, CD on main).
5) Deployment overview with an AWS architecture diagram (LLM-generated). Use Lambda + API Gateway + Amplify as the main flow, and optionally mention ECS + S3 + CloudFront as an alternative.
6) Postmortem: successes, failures, lessons learned.
7) Future work: 3-5 possible next features.

Visual requirements:
- Include at least two diagrams: (a) CI/CD flow diagram, (b) AWS deployment architecture diagram.
- Use simple, legible icons and a consistent color palette.
- Keep text minimal per slide; prefer visuals when possible.

Use the project facts below. If a detail is missing, use a reasonable placeholder and label it as a placeholder.

## Project Facts (ChatRoom)

### App name
- ChatRoom

### One-line summary
- A Discord-like clone with channel chat, unanswered-question detection, ongoing discussion tracking, and notification workflows.

### Target users
- Small teams or classes that need lightweight, structured chat with question tracking.

### Problem statement
- In fast-moving chat channels, questions get lost and discussions are hard to track; ChatRoom makes questions and active discussions visible and actionable.

### Core features
- Server and group channels (text channels).
- Channel conversations with message history.
- Unanswered question detection and listing.
- Question answered transitions with notifications.
- Ongoing discussion detection and status tracking.
- Simulated users that can respond with typing indicators and optional automated conversation chains.
- @mention support with autocomplete and mention-triggered responses.

### Backend architecture
- Single Express service with layered design: Routes/Controllers -> Services -> Repositories -> Data store.
- Core services: QuestionDetectionService, QuestionStatusService, DiscussionService, NotificationService, SimulatedResponseService.
- Repositories support in-memory and PostgreSQL persistence.
- Canonical write path: POST /api/channels/:channelId/messages triggers question lifecycle and notifications.

### Data storage
- In-memory mode for local dev.
- PostgreSQL mode for durability (messages, question_status, discussion_state_override, notifications).

### CI/CD workflows (GitHub Actions)
- Integration CI: run-backend-tests, run-frontend-tests, integration-tests.
- Backend CD (Lambda): build + package + aws lambda update-function-code on main.
- Frontend CD (Amplify): build frontend + aws amplify start-job on main.

### Deployment (primary: Lambda + API Gateway + Amplify)
- Backend: Node.js 20 Lambda, handler dist/lambda.handler.
- API Gateway HTTP API with ANY /{proxy+} route.
- Frontend: Vite build hosted on Amplify, VITE_API_URL points to API Gateway.

### Deployment (alternative: ECS + S3 + CloudFront)
- Backend: Dockerized Node API on ECS Fargate behind ALB.
- Frontend: Static Vite build on S3 + CloudFront distribution.

### Local run
- Frontend: http://localhost:5173
- Backend: http://localhost:4000
- Health check: http://localhost:4000/health

### Demo roadmap ideas
- Show login-less chat UI and channel list.
- Post a question; show it appears in Unanswered Questions.
- Reply from another user; show notification + question status update.
- Show Discussions tab populated by active discussions.
- Demonstrate simulated users responding with typing indicator and @mention.

### Postmortem talking points (seed list)
Successes:
- Unified backend design with clean service boundaries.
- Working question lifecycle + notification flow.
- CI + CD pipelines for cloud deploys.
Failures/Challenges:
- Edge cases in discussion detection thresholds.
- Managing simulated user behavior without noise.
Lessons:
- Clear write-path ownership prevents inconsistent state.
- Small, deterministic services are easier to test and iterate.

### Future work ideas (pick 3-5)
- Real user auth and roles.
- Threaded replies and message reactions.
- Enhanced discussion detection with ML.
- Search and filters for questions/discussions.
- Presence/typing across multiple clients with websockets.
