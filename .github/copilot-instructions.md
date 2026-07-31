# Copilot Instructions for SAST Link Next

## Project Architecture

This is the active SAST Link Next application, implemented as a Next.js 16 web project.

Core stack:

- Frontend: React 19 + TypeScript + Tailwind CSS v4
- UI primitives: shadcn/ui-style components in `components/ui/`
- State management: Zustand
- Data access: Axios and SWR
- Tests: Jest 30 + Testing Library + MSW

## Product Structure

### Tourist-side routes

- `app/page.tsx`: remembered-account switcher / root entry
- `app/(tourist)/login/page.tsx`: two-step login
- `app/(tourist)/register/page.tsx`: four-step registration
- `app/(tourist)/reset/page.tsx`: four-step password reset
- `app/(tourist)/oauth/callback/page.tsx`: third-party login landing page (reads `provider` query to show which account it is)
- `app/(tourist)/register/page.tsx`: registration (reads `oauth_state` from the login callback, not `state`)
- `app/(user)/oauth/bind/lark/page.tsx` · `github/page.tsx`: third-party bind callbacks (token-guarded)

### Authenticated routes

- `app/(user)/home/page.tsx`: homepage overview
- `app/(user)/home/layout.tsx`: top bar + profile/info side panels + profile fetch bootstrap
- `app/(user)/settings/page.tsx`: account settings and third-party identity management
- `app/(user)/settings/edit/page.tsx`: profile editing and avatar crop/upload

### Shared runtime modules

- `app/providers.tsx`: SWR config, global message panel
- `lib/api/client.ts`: Axios instance with `Token` header injection
- `lib/api/auth.ts`: auth/registration/reset helpers
- `lib/api/user.ts`: login/profile/avatar/bind-status helpers
- `store/`: Zustand stores
- `hooks/use-fetch-profile.ts`: syncs current profile into client state

## Runtime Model

1. Web mode: `pnpm dev`
2. Production static export: `pnpm build`

## Developer Workflows

### Package management

Always use `pnpm`.

Useful commands:

- `pnpm install`
- `pnpm dev`
- `pnpm build`
- `pnpm start`
- `pnpm lint`
- `pnpm test`
- `pnpm test:watch`
- `pnpm test:coverage`

### Code quality

- Type checking: `pnpm exec tsc --noEmit`
- Linting: `pnpm lint`
- Tests: `pnpm test`
- Coverage: `pnpm test:coverage`

Do not claim there is no test framework here. Jest is already configured and used.

## Styling and UI Patterns

- Tailwind CSS v4 via `@tailwindcss/postcss`
- Shared variables and theme tokens live in `app/globals.css`
- Use `cn()` from `@/lib/utils` for class merging
- Prefer existing UI building blocks before creating custom replacements

Common pattern:

```tsx
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

<Button asChild>
  <Link href="/home/edit">Edit profile</Link>
</Button>
```

## Project-Specific Guidance

- Do not describe this repository as a generic starter template.
- Preserve the split between `app/(tourist)` and `app/(user)` route groups.
- When updating auth behavior, inspect both API wrappers and Zustand stores.
- When updating homepage behavior, inspect side-panel state and `use-fetch-profile`.
- When updating avatar/profile editing, account for the existing slider + mouse-wheel zoom behavior.
- When changing build behavior, keep the static-export assumptions in docs and CI in sync.

## Configuration Notes

- TypeScript is strict and uses `@/*` alias mapping from repo root.
- The package name in `package.json` still says `react-quick-starter`, but UI/product semantics are SAST Link.
- `NEXT_PUBLIC_API_BASE_URL` configures the backend base URL — local dev points straight at the backend (e.g. `http://localhost:8080`).
