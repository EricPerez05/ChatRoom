# AWS Deployment Guide (Production)

This repository is now set up for:
- Backend: Dockerized Node API on Amazon ECS (Fargate)
- Frontend: Static Vite build on Amazon S3 + CloudFront

For Lambda + API Gateway + Amplify assignment flow, see:
- `deploy/aws/lambda-api-gateway-amplify-playbook.md`

## 1. Prerequisites

- AWS account with permissions for ECS, ECR, IAM, S3, CloudFront, and SSM Parameter Store
- A GitHub repository using Actions with OpenID Connect (OIDC)
- Domain names for frontend and backend (recommended)

## 2. Backend on ECS (Fargate)

### Files added
- `BackEnd/Dockerfile`
- `deploy/aws/backend-task-definition.json`
- `.github/workflows/deploy-backend-ecs.yml`

### One-time AWS setup
1. Create an ECR repository named `chatroom-backend`.
2. Create an ECS cluster `chatroom-prod` and a service `chatroom-backend-service`.
3. Create CloudWatch log group `/ecs/chatroom-backend`.
4. Create SSM secure string parameter for `DATABASE_URL`:
   - `/chatroom/prod/database-url`
5. Update placeholders in `deploy/aws/backend-task-definition.json`:
   - `<ACCOUNT_ID>`, `<REGION>`, `<FRONTEND_DOMAIN>`
6. Ensure your ALB target group health check path is `/health`.

### GitHub secrets
Set these in repository secrets:
- `AWS_DEPLOY_ROLE_ARN`: IAM role assumed by GitHub Actions

### Trigger deploy
- Push to `main` with backend changes, or run workflow manually.

## 3. Frontend on S3 + CloudFront

### Files added
- `.github/workflows/deploy-frontend-s3-cloudfront.yml`

### One-time AWS setup
1. Create an S3 bucket for static hosting (for example `chatroom-web-prod`).
2. Create a CloudFront distribution with S3 as origin.
3. Configure CloudFront default root object to `index.html`.
4. Add SPA routing behavior (404/403 fallback to `/index.html`).

### GitHub secrets
Set these in repository secrets:
- `AWS_DEPLOY_ROLE_ARN`: IAM role assumed by GitHub Actions
- `AWS_S3_BUCKET`: frontend deploy bucket name
- `AWS_CLOUDFRONT_DISTRIBUTION_ID`: distribution ID
- `VITE_API_URL`: public API base URL, for example `https://api.example.com`

### Trigger deploy
- Push to `main` with frontend changes, or run workflow manually.

## 4. Backend runtime environment

Use these runtime values in ECS task definition or parameter store:
- `PORT=4000`
- `PERSISTENCE_MODE=postgres`
- `DATABASE_URL=<from SSM/Secrets Manager>`
- `CORS_ORIGIN=https://chat.example.com`
- `MAX_WRITE_REQUESTS_PER_MINUTE=60`

`CORS_ORIGIN` accepts comma-separated values for multiple domains.

## 5. Local production parity (optional)

Use Docker Compose for a production-like run:

```bash
docker compose -f docker-compose.prod.yml up --build
```

- Frontend: `http://localhost:8080`
- Backend health: `http://localhost:4000/health`

## 6. Recommended hardening

- Move `DATABASE_URL` to AWS Secrets Manager if you prefer secret rotation.
- Add WAF in front of CloudFront.
- Add HTTPS certificates in ACM for frontend and API domains.
- Add autoscaling policies for ECS service.
