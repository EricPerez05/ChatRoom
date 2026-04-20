# ChatRoom

ChatRoom is a Discord-like clone with features for channel conversations, unanswered-question detection, ongoing discussion tracking, and notification workflows.

## Run the app locally

### Prerequisites

- Node.js 20.x
- npm

### One-command local run (Windows)

From repository root:

1. `powershell -ExecutionPolicy Bypass -File .\run-all.ps1`

This installs dependencies, runs tests/build, starts backend and frontend, and performs a backend health check.

### Manual local run

Backend:

1. `cd BackEnd`
2. `npm ci`
3. `npm run dev`

Frontend:

1. `cd FrontEnd`
2. `npm ci`
3. `npm run dev`

Local URLs:

- Frontend: `http://localhost:5173`
- Backend: `http://localhost:4000`
- Backend health: `http://localhost:4000/health`

## Testing

### Backend tests

1. `cd BackEnd`
2. `npm ci`
3. `npm test`

Coverage: `npm run test:coverage`

### Frontend tests

1. `cd FrontEnd`
2. `npm ci`
3. `npm test`

Coverage: `npm run test:coverage`

### Frontend-backend integration tests

1. `cd BackEnd && npm ci`
2. `cd ../FrontEnd && npm ci`
3. `npm run test:integration`

Deployed-environment smoke test (optional):

- PowerShell:
	`set RUN_DEPLOYED_INTEGRATION=true; set VITE_API_URL=https://<api-gateway-url>; npm run test:integration:deployed`
- bash:
	`RUN_DEPLOYED_INTEGRATION=true VITE_API_URL=https://<api-gateway-url> npm run test:integration:deployed`

The deployed test suite is intentionally conditional and will be skipped unless
`RUN_DEPLOYED_INTEGRATION=true` is set.

Integration test specification is in:

- `User Stories/Test Specifications/frontend-backend-integration-test-spec.md`

## AWS setup overview

This repository supports AWS deployment with Lambda (backend) + API Gateway + Amplify (frontend), plus CI/CD workflows.

You must create your own AWS account/team account manually in the AWS Console. That account creation step cannot be automated from this repository.

### Deployment files in this repo

- Lambda backend entrypoint: `BackEnd/src/lambda.ts`
- Lambda deploy workflow: `.github/workflows/deploy-aws-lambda.yml`
- Amplify deploy workflow: `.github/workflows/deploy-aws-amplify.yml`
- Integration test workflow: `.github/workflows/run-integration-tests.yml`
- Additional ECS/S3 templates: `deploy/aws/README.md`, `deploy/aws/backend-task-definition.json`

## Step-by-step AWS instructions for a new fork

### 1. Configure AWS credentials for GitHub Actions (recommended: OIDC)

1. Create an IAM role for GitHub OIDC trust.
2. Grant permissions for Lambda deploy and Amplify start-job.
3. Add repository secrets:
	- `AWS_DEPLOY_ROLE_ARN`
	- `AWS_LAMBDA_FUNCTION_NAME`
	- `AWS_AMPLIFY_APP_ID`
	- `AWS_AMPLIFY_BRANCH_NAME`
	- `VITE_API_URL`

### 2. Package and deploy backend to Lambda manually (CLI walkthrough)

From `BackEnd`:

1. `npm ci`
2. `npm run build:lambda`
3. `npm prune --omit=dev`
4. Create deployment zip:
	- PowerShell: `Compress-Archive -Path dist,node_modules,package.json -DestinationPath lambda-function.zip -Force`
	- bash/macOS/Linux: `zip -r lambda-function.zip dist node_modules package.json`
5. `aws lambda update-function-code --function-name <your-function-name> --zip-file fileb://lambda-function.zip --region <your-region>`
6. (recommended after packaging on local machine) `npm ci` to restore dev dependencies for normal local development.

Lambda handler value should be:

- `dist/lambda.handler`

Runtime should be Node.js 20.x.

### 3. Connect API Gateway to Lambda

1. In API Gateway, create an HTTP API (or REST API).
2. Add Lambda integration pointing to your backend Lambda function.
3. Add route `ANY /{proxy+}` (or explicit routes for `/health` and `/api/*`).
4. Deploy API and copy the invoke URL.
5. Set frontend env `VITE_API_URL` to that invoke URL.

### 4. Host frontend with Amplify

1. In Amplify, create app and connect your GitHub repository.
2. Select branch (usually `main`).
3. Build command: `npm ci && npm run build` (inside `FrontEnd`).
4. Publish directory: `dist`.
5. Configure env var in Amplify: `VITE_API_URL=<api-gateway-url>`.

### 5. Update frontend API base URL safely

Frontend API client supports both local and deployed modes:

- local dev fallback: `http://localhost:4000`
- deployed mode: `VITE_API_URL` (or same-origin fallback)

See implementation in `FrontEnd/src/app/services/api.ts`.

## CI/CD workflows

### Integration CI

- `.github/workflows/run-integration-tests.yml`
- Runs on push and pull request.
- Installs backend and frontend dependencies and executes `npm run test:integration`.

### Backend CD (Lambda)

- `.github/workflows/deploy-aws-lambda.yml`
- On push to `main`, it builds backend, packages Lambda zip, and calls `aws lambda update-function-code`.

### Frontend CD (Amplify)

- `.github/workflows/deploy-aws-amplify.yml`
- On push to `main`, it builds frontend and triggers Amplify redeploy with `aws amplify start-job`.

## GitHub hygiene and branch protection

Recommended repository protection for `main`:

1. Require pull request before merging.
2. Require status checks to pass before merging.
3. Select these checks at minimum:
	- `run-backend-tests`
	- `run-frontend-tests`
	- `integration-tests` (from `run-integration-tests.yml`)
4. Disable direct pushes to `main`.

Also follow this workflow:

1. Create a feature branch for each task.
2. Push branch and open PR.
3. Wait for CI checks and review approval.
4. Merge only after checks pass.

## Assignment requirement coverage checklist

- AWS account creation and console login: manual, must be done by your team in AWS Console.
- Lambda console experimentation (dummy function): documented in `deploy/aws/lambda-api-gateway-amplify-playbook.md`.
- Lambda packaging + AWS CLI upload/invoke: documented and CI workflow included.
- API Gateway integration with Lambda: documented and compatible with `BackEnd/src/lambda.ts`.
- Frontend API endpoint switch from localhost to cloud endpoint with local fallback: implemented in `FrontEnd/src/app/services/api.ts`.
- Frontend hosting with Amplify: documented and automated via `.github/workflows/deploy-aws-amplify.yml`.
- Integration test specification (English + table): `User Stories/Test Specifications/frontend-backend-integration-test-spec.md`.
- Integration tests implementation: `FrontEnd/tests/integration/frontend-backend.integration.test.ts` and `FrontEnd/tests/integration/deployed-environment.integration.test.ts`.
- Integration tests in CI: `.github/workflows/run-integration-tests.yml`.
- CD on push to `main` for backend Lambda and frontend Amplify: `.github/workflows/deploy-aws-lambda.yml` and `.github/workflows/deploy-aws-amplify.yml`.

## Actions you still perform manually

- Create AWS account, Lambda function, API Gateway API, and Amplify app.
- Add GitHub repository secrets/variables in your repo settings.
- Configure GitHub branch protection rules.
- Create a real feature-branch PR in GitHub and verify green checks in the Actions tab.

## Notes

- For Lambda/API Gateway experimentation, you can first create a simple hello-world Lambda in AWS Console, test it, then switch to this project Lambda package flow.
- After the course/project period, delete or disable any unused cloud resources to avoid cost.
