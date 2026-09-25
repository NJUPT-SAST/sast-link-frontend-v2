# CLAUDE.md

This file provides guidance to Claude Code when working with this repository.

## Project Overview

This repository is the current SAST Link Frontend V2 implementation, not a generic starter template. It combines:

- Next.js 16 App Router
- React 19
- TypeScript
- Tailwind CSS v4
- shadcn/ui-style primitives
- Zustand for client-side state
- Axios + SWR for frontend data access patterns

## Product Flows in the Repo

### Tourist flows

- `/` account switcher and quick-login entry
- `/login` two-step login (account step + password step)
- `/register` three-step registration; `/register/alumni` alumni account-request flow (Turnstile-gated)
- `/reset` password reset
- `/oauth/callback` third-party OAuth login landing page (exchanges the login code, or forwards new accounts to register)
- `/oauth/error` third-party login error page (retryable vs terminal error codes)
- `/terms`, `/privacy` user agreement and privacy policy

### Authenticated flows

- `/home` user homepage overview
- `/profile` profile overview; `/profile/edit` profile editing and avatar upload/cropping; `/profile/complete` guided profile completion
- `/settings` account settings — password change, third-party identity bind/unbind, personal-badge sharing (opt-in capability-URL SVG embed), and authorized-app (OAuth grants) management
- `/oauth/bind/lark` / `/oauth/bind/github` third-party bind callbacks (frontend assembles the authorize URL with a CSRF `state`; the provider bounces back here)
- `/oauth/consent` authorization consent page — this app acting as the OAuth **server** for third-party clients (e.g. Evento): verifies client metadata from the backend, never from the URL

### Admin flows

- `/admin/users` user search, filtering, editing, deletion, and restoration
- `/admin/oauth-clients` OAuth client registration and status management
- `/admin/audit-logs` audit log filtering and pagination
- `/admin/alumni-requests` alumni account-request review and approval

`admin` can access all four routes. `lecturer` has read-only access to user management.

## Runtime Model

- Web mode: `pnpm dev`
- Static-export build: `pnpm build`

## Development Commands

```bash
pnpm dev
pnpm build
pnpm start
pnpm lint
pnpm test
pnpm test:watch
pnpm test:coverage
pnpm exec tsc --noEmit
pnpm dlx shadcn@latest add <component-name>
```

## Architecture

### Frontend structure

- `app/` App Router routes, layouts, providers, and page tests
- `components/` shared UI and feature-oriented components
- `hooks/` shared hooks such as `use-auth-session` (session bootstrap), `use-identities` (third-party binds), and the admin hook family
- `lib/api/` Axios client plus auth/user/oauth wrappers
- `lib/validations/` form validation rules
- `store/` Zustand stores for the account list and user profile
- `mocks/` MSW bootstrap

Authentication is session-based, not store-based: the access token lives in memory + `sessionStorage` via `lib/token.ts`, and the refresh token never enters JS-readable storage (httpOnly cookie only).

### Build integration

- `next.config.ts` uses `output: "export"`
- Dev-only rewrite proxies `/v2/*` to the production backend (same-origin cookie sessions)

### Styling system

- Tailwind CSS v4 via PostCSS
- shared CSS variables in `app/globals.css`
- `tw-animate-css`
- shadcn/ui-style component patterns in `components/ui/`

## Testing Reality

This repository already has an active Jest setup.

- Test runner: Jest 30
- Environment: `jest-fixed-jsdom`
- Coverage command: `pnpm test:coverage`
- Config: `jest.config.ts`
- Setup files: `jest.setup.ts`, `jest.polyfills.ts`

Tests currently exist across:

- `app/`
- `components/`
- `hooks/`
- `lib/`
- `store/`

## Path Aliases

`@/*` maps to the repository root.

Common imports:

```tsx
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useUserListStore } from "@/store/use-user-list-store";
```

## Contribution Discipline

Read [CONTRIBUTING.md](./CONTRIBUTING.md) before making changes — it is the source of truth for branching, PR expectations, and documentation responsibilities. The rules below are non-negotiable:

- **Never develop on `master`.** Every change — feature, fix, docs, or chore, however small — is made on a descriptive branch cut from `master` (`feat/…`, `fix/…`, `docs/…`, `test/…`, `refactor/…`, `chore/…`) and lands exclusively through a reviewed pull request. Direct commits on `master` and direct pushes to `master` are forbidden.
- **Every modification must be tested before it is considered done.** At minimum run `pnpm lint` and `pnpm test`; run `pnpm build` (and `pnpm exec tsc --noEmit`) for anything touching routes, config, or build behavior. When changing runtime behavior, update or add the closest colocated test.
- **Commits must be atomic.** One commit per logical change — a refactor, its tests, and its docs belong together, but two unrelated changes never share a commit.
- **Commit messages follow Conventional Commits** (`feat:`, `fix:`, `docs:`, `refactor:`, `test:`, `ci:`, `chore:`), scoped when helpful, e.g. `fix(auth): handle oauth callback retry`.
- **Keep `CHANGELOG.md` in sync.** User-visible changes (features, fixes, behavior changes) get an entry under `[Unreleased]` in the same commit that introduces them.

## Critical Notes

- Always use `pnpm`.
- Do not assume this repo is still a starter; inspect the real route groups and state/API modules first.
- `NEXT_PUBLIC_API_BASE_URL` selects the backend base. In dev, `/v2` routes through the same-origin rewrite proxy (recommended — cookie sessions and the OAuth flow work); `http://localhost:8080` connects directly to a local backend (cross-origin; cookie-session features are unavailable). See `.env.example` for the full set of public variables, including OAuth bind client ids/redirects and the Turnstile site key.
- The npm package name still uses starter-style naming; treat current code/config as source of truth rather than marketing labels.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
