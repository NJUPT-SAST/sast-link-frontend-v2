# SAST Link Frontend V2

The account-system frontend for SAST Link — login, registration, password reset, OAuth callbacks, user homepage, and the admin console — built on Next.js 16.

<div align="center">

[![CI](https://github.com/NJUPT-SAST/sast-link-frontend-v2/actions/workflows/ci.yml/badge.svg)](https://github.com/NJUPT-SAST/sast-link-frontend-v2/actions/workflows/ci.yml)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

[简体中文](README_zh.md) | [English](README.md)

</div>

## Quick Start

Requires Node.js 20+ and pnpm.

```bash
pnpm install
pnpm dev      # http://localhost:3000
```

The frontend is useless without a backend; `NEXT_PUBLIC_API_BASE_URL` decides which one it talks to:

- `/v2` — in dev, `next.config.ts` rewrites `/v2/*` to `https://link.sast.fun` (the production backend), so the browser sees same-origin. **This is the mode the httpOnly session cookie needs** (see Sessions below).
- `http://localhost:8080` — a direct cross-origin backend. Login works, but the new-tab cookie bootstrap is off, so a signed-in browser opening a fresh tab lands on the login page.

Copy `.env.example` to `.env.local` and fill in the OAuth client ids:

```env
NEXT_PUBLIC_API_BASE_URL=/v2
NEXT_PUBLIC_FEISHU_CLIENT_ID=
NEXT_PUBLIC_FEISHU_BIND_REDIRECT_URI=http://localhost:3000/oauth/bind/lark
NEXT_PUBLIC_GITHUB_CLIENT_ID=
NEXT_PUBLIC_GITHUB_BIND_REDIRECT_URI=http://localhost:3000/oauth/bind/github
```

`NEXT_PUBLIC_*` values are baked into the static bundle at build time — never put secrets there.

## Features

- **Login & accounts**: password login, two-step registration, password reset, GitHub and Feishu sign-in
- **OAuth IdP frontend**: the third-party consent screen, authorized-apps management, and GitHub/Feishu bind callbacks
- **Tabs share one session**: the refresh token lives only in the backend's httpOnly cookie; a fresh tab rebuilds the session by calling `POST /auth/refresh` with the cookie, so a logged-in browser is never bounced to /login
- **Admin console**: user search/edit/delete, OAuth client registry, audit log viewer
- **Static export**: `output: "export"`, served behind a Caddy proxy

## Sessions

Access tokens are short-lived (1h) and live in `sessionStorage`; refresh tokens never enter JS — the backend writes them into an httpOnly `sl_session` cookie (`Path=/v2`, `SameSite=Lax`). New tabs and the OAuth authorize→consent flow bootstrap from that cookie. Logout in one tab revokes the whole session family server-side and tells the other tabs via a `storage` event.

The trade-off: it needs the frontend and backend to be same-origin, which is why `/v2` is the recommended mode. We dropped localStorage token sharing for this — on an identity provider, a script-readable refresh token is the whole account.

## Documentation

- [TESTING.md](./TESTING.md) — test strategy and commands
- [CI_CD.md](./CI_CD.md) — GitHub Actions workflows
- [CONTRIBUTING.md](./CONTRIBUTING.md) — contribution workflow

## Development

```bash
pnpm lint
pnpm test
pnpm build     # static export to out/
```

## License

[MIT](./LICENSE) © NJUPT SAST
