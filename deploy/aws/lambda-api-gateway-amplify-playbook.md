# Lambda + API Gateway + Amplify Playbook

This playbook mirrors the assignment sequence and is designed for first-time AWS setup.

## 1. Create and access AWS account

1. Open AWS Console and create account (or use your team account).
2. Log in and select your working region (for example `us-east-1`).
3. Install and configure AWS CLI locally:
   - `aws configure`
   - Set Access Key, Secret Key, default region, output format.

## 2. Learn Lambda with a dummy function (Console)

1. Go to Lambda -> Create function.
2. Choose Author from scratch.
3. Name: `chatroom-dummy-lambda`.
4. Runtime: Node.js 20.x.
5. Create function.
6. Paste this minimal handler in `index.mjs`:

```js
export const handler = async (event) => {
  return {
    statusCode: 200,
    body: JSON.stringify({ ok: true, received: event }),
  };
};
```

7. Click Deploy.
8. Use Test -> Create test event -> Invoke.
9. Confirm successful JSON response.

## 3. Package and invoke project Lambda via AWS CLI

Backend Lambda handler in this repo:

- `BackEnd/src/lambda.ts`
- Compiled handler path: `dist/lambda.handler`

### Build + package

From `BackEnd`:

1. `npm ci`
2. `npm run build:lambda`
3. `npm prune --omit=dev`
4. `zip -r lambda-function.zip dist node_modules package.json`

### Deploy code

```bash
aws lambda update-function-code \
  --function-name <your-lambda-function-name> \
  --zip-file fileb://lambda-function.zip \
  --region <your-region>
```

### Set runtime config (one-time or when changed)

```bash
aws lambda update-function-configuration \
  --function-name <your-lambda-function-name> \
  --handler dist/lambda.handler \
  --runtime nodejs20.x \
  --timeout 30 \
  --memory-size 512 \
  --region <your-region>
```

### Invoke from CLI

```bash
aws lambda invoke \
  --function-name <your-lambda-function-name> \
  --payload '{"httpMethod":"GET","path":"/health","headers":{},"requestContext":{}}' \
  --cli-binary-format raw-in-base64-out \
  out.json
```

Inspect `out.json` to verify `statusCode` and health response body.

## 4. Integrate Lambda with API Gateway

1. API Gateway -> Create API -> HTTP API.
2. Integration target: your Lambda function.
3. Add route:
   - `ANY /{proxy+}`
4. Deploy stage (for example `prod`).
5. Copy invoke URL, for example:
   - `https://abc123.execute-api.us-east-1.amazonaws.com`
6. Verify endpoints:
   - `GET <invoke-url>/health`
   - `GET <invoke-url>/api/servers`

## 5. Point frontend to API Gateway while preserving local mode

Frontend API client in:

- `FrontEnd/src/app/services/api.ts`

Behavior:

- Uses `VITE_API_URL` when present.
- Local fallback remains `http://localhost:4000`.
- Production fallback supports same-origin deployments.

For local deployed smoke tests:

- PowerShell:
  `set RUN_DEPLOYED_INTEGRATION=true; set VITE_API_URL=https://<api-gateway-url>; npm run test:integration:deployed`

## 6. Deploy frontend with Amplify

1. Amplify -> New app -> Host web app.
2. Connect GitHub repository.
3. Choose branch (`main`).
4. Build settings:
   - Install/build commands in `FrontEnd` (`npm ci`, `npm run build`).
   - Artifacts directory: `dist`.
5. Add environment variable:
   - `VITE_API_URL=https://<api-gateway-url>`
6. Deploy and verify app URL.

## 7. Integration testing strategy

- Spec file: `User Stories/Test Specifications/frontend-backend-integration-test-spec.md`
- Local integration tests: `npm run test:integration` (inside `FrontEnd`)
- Deployed smoke tests: `npm run test:integration:deployed` with `RUN_DEPLOYED_INTEGRATION=true`

## 8. CI and CD workflows included

- Integration CI: `.github/workflows/run-integration-tests.yml`
- Lambda CD: `.github/workflows/deploy-aws-lambda.yml`
- Amplify CD: `.github/workflows/deploy-aws-amplify.yml`

Required GitHub secrets:

- `AWS_DEPLOY_ROLE_ARN`
- `AWS_LAMBDA_FUNCTION_NAME`
- `AWS_AMPLIFY_APP_ID`
- `AWS_AMPLIFY_BRANCH_NAME`
- `VITE_API_URL`

## 9. Branch protection and merge hygiene

In GitHub repository settings:

1. Add branch protection rule for `main`.
2. Require pull request before merging.
3. Require status checks to pass before merging.
4. Select frontend/backend unit workflows and integration workflow.
5. Block direct pushes to `main`.
