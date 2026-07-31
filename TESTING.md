# Testing Guide

This repository already uses Jest as its active test runner. Tests are colocated with the implementation and cover route components, shared UI, hooks, stores, and API helpers.

## Current Test Stack

- Jest 30
- `next/jest` integration
- `jest-fixed-jsdom` environment
- React Testing Library
- `@testing-library/user-event`
- `@testing-library/jest-dom`
- MSW for request mocking where needed
- `jest-junit` for CI test result output

## Source of Truth

The main configuration lives in:

- `jest.config.ts`
- `jest.setup.ts`
- `jest.polyfills.ts`

Important current config details:

- `collectCoverage` is `false` by default in config, but `pnpm test:coverage` enables it from the CLI.
- Coverage is collected from `app/`, `components/`, `hooks/`, `lib/`, and `store/`.
- Coverage thresholds are configured globally:
  - branches: 60
  - functions: 60
  - lines: 70
  - statements: 70
- Tests ignore `.next/`, `out/`, and `node_modules/`.
- Path alias `@/` is mapped to the repository root.

## Available Commands

| Command | Use |
| --- | --- |
| `pnpm test` | Run the full Jest suite once |
| `pnpm test:watch` | Run Jest in watch mode |
| `pnpm test:coverage` | Generate coverage artifacts in `coverage/` |

Examples:

```bash
pnpm test
pnpm test:watch
pnpm test:coverage
```

To run a single file:

```bash
pnpm test -- app/page.test.tsx
```

To filter by name:

```bash
pnpm test -- --testNamePattern="login"
```

## What Is Currently Tested

### App routes and providers

- `app/layout.test.tsx`
- `app/page.test.tsx`
- `app/providers.test.tsx`
- `app/(tourist)/login/page.test.tsx`
- `app/(user)/home/homepage.test.tsx`
- `app/(user)/home/edit/page.test.tsx`

### Components

Representative examples:

- `components/animation/page-transition.test.tsx`
- `components/auth/auth-shell.test.tsx`
- `components/auth/verification-code-input.test.tsx`
- `components/auth/other-login-list.test.tsx`
- `components/layout/top-bar.test.tsx`
- `components/navigation/back-button.test.tsx`
- `components/ui/button.test.tsx`

### Hooks

- `hooks/use-fetch-profile.test.tsx`

### Libraries and API wrappers

- `lib/message.test.ts`
- `lib/token.test.ts`
- `lib/utils.test.ts`
- `lib/api/auth.test.ts`
- `lib/api/client.test.ts`
- `lib/api/oauth.test.ts`
- `lib/api/user.test.ts`
- `lib/validations/auth.test.ts`
- `lib/validations/profile.test.ts`

### Zustand stores

- `store/use-panel-store.test.ts`
- `store/use-user-list-store.test.ts`
- `store/use-user-profile-store.test.ts`

## Testing Conventions in This Repo

- Prefer colocated test files next to the source they cover.
- Use `*.test.ts` or `*.test.tsx`.
- Test visible behavior and state transitions instead of implementation internals.
- Use accessible queries first: `getByRole`, `getByLabelText`, `getByText`.
- Use `userEvent` for interactions instead of lower-level DOM event helpers when possible.

## Mocking and Setup Notes

### Next.js integration

`next/jest` is used so the Jest environment stays aligned with the Next.js project config.

### Global setup

`jest.setup.ts` is used for testing-library setup and shared mocks.

### MSW support

The repository includes an MSW setup and a `NEXT_PUBLIC_API_MOCKING` switch in application runtime. Tests that need network isolation can use the existing mock infrastructure rather than inventing a second mocking strategy.

## Coverage Output

`pnpm test:coverage` writes to `coverage/` and produces:

- HTML report
- `lcov.info`
- JSON coverage
- Clover
- Cobertura
- `coverage/junit.xml`

The CI workflow uploads:

- `coverage/junit.xml` as `test-results`
- the entire `coverage/` directory as `coverage-report`

## How CI Uses Tests

The current GitHub Actions flow runs:

```bash
pnpm test:coverage
pnpm build
```

inside `.github/workflows/test.yml`.

So if you change runtime behavior, you should expect both the Jest suite and the static export build to remain green.

## Recommended Local Validation Before Merging

For doc-only changes:

```bash
pnpm lint
```

For code changes:

```bash
pnpm test
pnpm lint
pnpm build
```

## Troubleshooting

### Tests fail because of stale build artifacts

Clear transient output if needed:

```bash
rm -rf .next coverage
```

### Module alias resolution issues

Check that:

- `tsconfig.json` still maps `@/*`
- `jest.config.ts` still maps `^@/(.*)$` to `<rootDir>/$1`

### Coverage looks inconsistent

Remember:

- `collectCoverage` is off in base config
- `pnpm test:coverage` is the command that turns on coverage collection for normal workflows
