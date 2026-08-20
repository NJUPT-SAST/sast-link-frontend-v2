# CI/CD Guide

This document summarizes the current GitHub Actions setup for `sast-link-frontend-v2`.

## Workflow Files

| File | Purpose |
| --- | --- |
| `.github/workflows/ci.yml` | Main orchestrator for push / PR CI and deploy |
| `.github/workflows/quality.yml` | Lint, type-check, audit, dependency freshness |
| `.github/workflows/test.yml` | Jest coverage run, test/coverage artifact upload, Next.js build |
| `.github/workflows/deploy.yml` | Docker build + registry push + server deploy (health-check + rollback) |
| `.github/workflows/release.yml` | Tag-triggered release pipeline that drafts a GitHub Release (notes only) |

## Triggers

### `ci.yml`

Runs on:

- push to `master`
- push to `develop`
- pull request targeting `master`
- pull request targeting `develop`

Then calls:

1. `quality.yml`
2. `test.yml`
3. `deploy.yml` (only on push to `master`, after quality and test pass)

### `quality.yml`

Runs on:

- `workflow_call`
- `workflow_dispatch`

Checks:

1. `pnpm lint` (blocking)
2. `pnpm exec tsc --noEmit` (blocking)
3. `pnpm audit --audit-level=critical` (blocking)
4. `pnpm outdated` (non-blocking)

### `test.yml`

Runs on:

- `workflow_call`
- `workflow_dispatch`

Main steps:

1. setup pnpm + Node.js
2. `pnpm install --frozen-lockfile`
3. `pnpm test:coverage` (coverage thresholds enforced via jest.config.ts)
4. upload `coverage/junit.xml` as `test-results`
5. upload `coverage/` as `coverage-report`
6. publish test results as PR comment
7. `pnpm build`
8. upload `out/` as `nextjs-build`

### `deploy.yml`

Called by `ci.yml` on push to `master`. Builds the production Docker image, transfers it to the server, and executes the deployment with health-check verification and automatic rollback on failure.

Required secrets:

- `SERVER_HOST`
- `SERVER_USER`
- `SSH_PRIVATE_KEY`

### `release.yml`

Triggered when pushing tags matching `v*`.

Pipeline:

1. run `quality.yml`
2. run `test.yml`
3. create draft GitHub Release (changelog via `generate_release_notes`; no build artifacts attached)

## Build Relationship

Current build output flow:

- `pnpm build` uses `next.config.ts` with `output: "export"`
- static files are generated in `out/`
- CI and release workflows both consume `out/` artifacts

## Caches And Artifacts

Current workflows use:

- pnpm cache via `actions/setup-node`
- test artifacts (`coverage/junit.xml`, `coverage/`)
- static build artifact (`out/`)

## Coverage

- Jest coverage thresholds are enforced in `jest.config.ts` (branches: 75%, functions: 60%, lines: 50%, statements: 50%)
- Results are published as a step summary using `coverage-summary.json`
- JUnit XML via `jest-junit` reporter for PR test result integration

## Required Secrets & Variables

| Secret | Used By |
| --- | --- |
| `SERVER_HOST` | `deploy.yml` |
| `SERVER_USER` | `deploy.yml` |
| `SSH_PRIVATE_KEY` | `deploy.yml` |
| `TCR_USERNAME` | `deploy.yml` (registry login, build & runtime) |
| `TCR_PASSWORD` | `deploy.yml` (registry login, build & runtime) |

Repository **variables** (public by design — they end up in the browser bundle, so they live in Settings > Variables, not Secrets): `API_BASE_URL`, `FEISHU_CLIENT_ID`, `GH_CLIENT_ID`, `FEISHU_BIND_REDIRECT_URI`, `GH_BIND_REDIRECT_URI`. `deploy.yml` fails loudly on master if any of them is missing, because `next.config.ts` uses `output: "export"` and inlines `NEXT_PUBLIC_*` at build time — there is no runtime patching.

## Maintenance Checklist

When editing CI behavior, keep these in sync:

1. `.github/workflows/*.yml`
2. this file (`CI_CD.md`)
3. top-level docs (`README.md`, `README_zh.md`, `CONTRIBUTING.md`)
