# Contributing

This repository is the active SAST Link Frontend V2 implementation, not a blank starter. When contributing, please keep changes aligned with the existing product flows, route structure, and CI expectations instead of treating the project like a fresh template.

## Before You Start

Make sure you can run the project locally:

```bash
pnpm install
pnpm dev
```

## Branching

The current CI workflows are wired for `master` and `develop`, and the local repository is presently on `master`.

Suggested branch naming:

- `feat/<short-description>`
- `fix/<short-description>`
- `docs/<short-description>`
- `test/<short-description>`
- `refactor/<short-description>`
- `ci/<short-description>`
- `chore/<short-description>`

Examples:

- `feat/add-user-bind-status-card`
- `fix/register-ticket-error`
- `docs/update-testing-guide`

## Development Expectations

### Preserve the actual app structure

Key areas to understand before changing behavior:

- `app/(tourist)` for unauthenticated flows
- `app/(user)` for authenticated flows
- `lib/api` for backend integration
- `store/` for Zustand state

### Follow current conventions

- Use TypeScript and keep strict typing intact.
- Use `@/` imports for internal modules.
- Keep route files lowercase (`page.tsx`, `layout.tsx`).
- Use colocated tests where practical.
- Prefer existing UI primitives in `components/ui/` and established layout components before introducing new patterns.

## Local Validation

### Minimum for most code changes

```bash
pnpm lint
pnpm test
pnpm build
```

### For documentation-only changes

At minimum, make sure the documented commands and file paths match the repo as it exists now.

## Commit Style

Use Conventional Commits whenever possible:

- `feat:`
- `fix:`
- `docs:`
- `refactor:`
- `test:`
- `ci:`
- `chore:`

Examples:

```text
feat(auth): add github callback state handling
fix(profile): clamp avatar zoom wheel interactions
docs(readme): sync setup guide with current routes
test(api): add auth client coverage
```

## Pull Requests

Use the repository’s PR template and include:

- what changed
- why it changed
- how it was validated
- screenshots or recordings for UI changes

Before opening a PR:

1. self-review the diff
2. make sure related docs are updated
3. confirm CI-relevant commands still pass locally when applicable

## Documentation Responsibilities

Update docs when you change:

- routes or user flows
- environment variables
- build or test commands
- CI behavior

Primary documentation files:

- `README.md`
- `README_zh.md`
- `TESTING.md`
- `CI_CD.md`
- `CONTRIBUTING.md`

## Testing Guidance

If you add or change behavior:

- update or add colocated Jest tests when feasible
- keep tests focused on user-visible behavior and state transitions
- avoid weakening coverage or CI thresholds without documenting the reason

See [TESTING.md](./TESTING.md) for the current test setup.

## Issues and Follow-up

If you cannot complete a change fully:

- document the exact boundary
- leave reproducible notes
- avoid vague “partial” states without explaining what still blocks completion

That makes the next contributor much faster and reduces re-discovery work.
