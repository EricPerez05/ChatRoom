# ChatRoom
Discord like clone where it has a summarizing feature of the chat, or any relevant channels. Including weekly recaps, and finding open discussions.

# Script
to run everything run
powershell -ExecutionPolicy Bypass -File .\run-all.ps1

# Continuous Integration (GitHub Actions)
This project includes two CI workflows in .github/workflows:

- run-frontend-tests.yml
- run-backend-tests.yml

They run Jest tests on push and pull_request events for their respective folders.

# Run Frontend Tests Locally

## Prerequisites
- Node.js 20.x
- npm (bundled with Node.js)

## Install dependencies
From the repository root:

1. cd FrontEnd
2. npm ci

This installs all test libraries used by the frontend, including Jest, ts-jest, jest-environment-jsdom, @testing-library/react, and @testing-library/jest-dom.

## Run tests
From FrontEnd:

1. npm test

To generate coverage:

1. npm run test:coverage

# Run Backend Tests Locally

## Prerequisites
- Node.js 20.x
- npm (bundled with Node.js)

## Install dependencies
From the repository root:

1. cd BackEnd
2. npm ci

This installs all test libraries used by the backend, including Jest, ts-jest, and supertest.

## Run tests
From BackEnd:

1. npm test

To generate coverage:

1. npm run test:coverage
