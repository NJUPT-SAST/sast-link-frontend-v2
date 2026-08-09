# SAST Link Next

The SAST Link account system on Next.js 16: login, registration, password reset, OAuth callbacks, and the user homepage.

[中文文档](./README_zh.md)

## Stack

Next.js 16 App Router (`output: "export"`, static build) · React 19 · TypeScript · Tailwind CSS v4 · shadcn/ui · Zustand · SWR + Axios · Jest 30 + Testing Library + MSW

## Routes

- Tourist: `/` account switcher · `/login` · `/register` · `/reset` · `/oauth/callback` (login landing page)
- User: `/home` · `/settings` · `/settings/edit` — `app/(user)/layout.tsx` redirects to `/login` when no token is present.
- OAuth bind callbacks: `/oauth/bind/lark` · `/oauth/bind/github` (frontend assembles the authorize URL; the callback lands back on the frontend)
- Admin: `/admin/users` · `/admin/oauth-clients` · `/admin/audit-logs`

## Develop

Node.js 20+ and pnpm.

```bash
pnpm install
pnpm dev        # http://localhost:3000
```

`.env.local`:

```env
# Local dev: point straight at the backend on 8080 (backend must allow
# http://localhost:3000 in CORS_ALLOWED_ORIGINS)
NEXT_PUBLIC_API_BASE_URL=http://localhost:8080
# OAuth binding (values mirror the backend OAUTH_* config)
NEXT_PUBLIC_FEISHU_CLIENT_ID=
NEXT_PUBLIC_FEISHU_BIND_REDIRECT_URI=http://localhost:3000/oauth/bind/lark
NEXT_PUBLIC_GITHUB_CLIENT_ID=
NEXT_PUBLIC_GITHUB_BIND_REDIRECT_URI=http://localhost:3000/oauth/bind/github
```

- `NEXT_PUBLIC_API_BASE_URL` points straight at the backend. Local dev connects to `:8080` directly; the backend validates against `CORS_ALLOWED_ORIGINS`.
- `NEXT_PUBLIC_*` values are baked in at build time. Never put secrets there.

## Commands

| Command | What it does |
| --- | --- |
| `pnpm dev` | Dev server on port 3000 |
| `pnpm build` | Static export to `out/` |
| `pnpm lint` | ESLint |
| `pnpm test` | Jest |
| `pnpm test:watch` | Jest in watch mode |
| `pnpm test:coverage` | Jest with coverage |

## Structure

```text
app/          # routes, layouts, providers — tests live next to pages
components/   # shared UI: auth, layout, motion, feedback, ui primitives
hooks/        # shared hooks (use-fetch-profile)
lib/          # api/ (Axios client + auth/user/oauth wrappers), validations, token, message
mocks/        # MSW handlers
store/        # Zustand stores (user list, profile, panel)
```

## Docs

- [TESTING.md](./TESTING.md) — test strategy and commands
- [CI_CD.md](./CI_CD.md) — GitHub Actions workflows
- [CONTRIBUTING.md](./CONTRIBUTING.md) — contribution workflow
