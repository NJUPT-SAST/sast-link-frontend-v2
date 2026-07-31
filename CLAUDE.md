# CLAUDE.md

This file provides guidance to Claude Code when working with this repository.

## Project Overview

This repository is the current SAST Link Next implementation, not a generic starter template. It combines:

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
- `/login` two-step login
- `/register` three-step registration
- `/reset` password reset
- `/oauth/callback` third-party OAuth login landing page (exchanges the login code, or forwards new accounts to register)

### Authenticated flows

- `/home` user homepage overview
- `/settings` account settings and profile overview
- `/settings/edit` profile editing and avatar upload/cropping
- `/oauth/bind/lark` / `/oauth/bind/github` third-party bind callbacks (frontend assembles the authorize URL; the provider bounces back here)

### Admin flows

- `/admin/users` user search, filtering, editing, deletion, and restoration
- `/admin/oauth-clients` OAuth client registration and status management
- `/admin/audit-logs` audit log filtering and pagination

`admin` can access all three routes. `lecturer` has read-only access to user management.

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
- `hooks/` shared hooks such as `use-fetch-profile`
- `lib/api/` Axios client plus auth/user/oauth wrappers
- `lib/validations/` form validation rules
- `store/` Zustand stores for auth, accounts, panels, and profile state
- `mocks/` MSW bootstrap
- `tests/` shared test helpers and higher-level tests

### Build integration

- `next.config.ts` uses `output: "export"`

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
import { useAuthStore } from "@/store/use-auth-store";
```

## Critical Notes

- Always use `pnpm`.
- Do not assume this repo is still a starter; inspect the real route groups and state/API modules first.
- `NEXT_PUBLIC_API_BASE_URL` is the backend base URL — local dev points straight at the backend (e.g. `http://localhost:8080`), no `/apis` prefix.
- The npm package name still uses starter-style naming; treat current code/config as source of truth rather than marketing labels.
