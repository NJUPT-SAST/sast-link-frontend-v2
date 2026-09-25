# Changelog

All notable changes to this repository should be documented here.

The format loosely follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and the version field should continue following Semantic Versioning if formal releases are published.

## [Unreleased]

### Added

- Next.js App Router implementation for SAST Link tourist and authenticated flows
- Two-step login flow
- Three-step registration flow
- Single-page password reset flow
- Feishu and GitHub OAuth login landing page (`/oauth/callback`) and bind callbacks (`/oauth/bind/lark`, `/oauth/bind/github`)
- Root-page remembered-account switcher
- Authenticated homepage overview and side-panel composition
- Profile editing, avatar upload, and avatar wheel zoom support
- Zustand stores for account list, profile state, and homepage panel state
- Axios-based API client and auth/user API wrappers
- Jest 30 + Testing Library + MSW test setup
- Admin console overview folds V010-flagged incomplete-profile accounts into a single 未补全 slice in the role and state donuts (subtracted from their true buckets, so the total denominator is unchanged); consumes the new `incomplete_by_role` / `incomplete_by_state` fields from `GET /admin/stats`
- GitHub Actions workflows for quality checks, coverage runs, static export build, and draft releases

### Changed

- Profile completion and edit forms refuse control-character majors before submitting (shared `majorSchema`; the backend V015 rule reports such values as incomplete, and a value slipping through would come back as a 400 whose cause is invisible in the input)
- The admin console's user create/update forms now validate `name` with `realNameSchema` (Han + interpunct only), matching the user-facing registration/completion forms and the backend V016 rule that refuses out-of-set names on every write path — an admin can no longer provision an account that is flagged incomplete the moment it exists
- Profile signature editing uses a single-line input; line breaks are stripped before submit (the backend rejects control characters, which surfaced as a generic 参数错误 when a mobile keyboard or pasted text introduced a newline)
- The profile-card signature edit affordance is now an always-visible pencil icon instead of a hover-only text hint, so touch devices can find the entry point
- Documentation has been rewritten to match the current repository implementation rather than the original generic starter-template description

### Documentation

- `README.md` now describes the real routes, modules, environment variables, and build behavior
- `README_zh.md` has been synced with the same implementation detail in Chinese
- `CI_CD.md` now reflects the actual workflow files and their enabled/disabled state
- `TESTING.md` now reflects the active Jest configuration and current test coverage layout
- `CONTRIBUTING.md` now reflects the actual contribution and validation expectations for this repo
- `CLAUDE.md` route map and module inventory synced with the current implementation: adds the OAuth consent/error/alumni/profile-completion routes and the fourth admin console route, corrects profile editing to `/profile/edit`, drops the removed auth/panel stores and non-existent `tests/` directory in favor of the session-based auth model, and refreshes the `NEXT_PUBLIC_API_BASE_URL` guidance for the `/v2` dev proxy; it now also points at `CONTRIBUTING.md` and states the mandatory validation, atomic Conventional Commits, and CHANGELOG-sync discipline
- `CLAUDE.md` contribution discipline now explicitly forbids developing on `master`: every change is made on a feature branch and lands only through a reviewed pull request

### Added

- **个人徽标分享**（feat/card-badge）：设置页新增「个人徽标」区块——开关式分享一枚可嵌入任意网页（GitHub README、友链列表）的 SVG 身份卡片，链接即凭证（后端随机 capability key，不可枚举）。尺寸/主题分段式选择器 + 实时预览（直连公开渲染端点，可点击跳转个人主页：blog 优先、github 兜底），一键复制链接；关闭需确认弹窗（警示嵌入链接立即失效，重新开启后原链接恢复可用——开关不轮换 key）。配套 `lib/api/badge.ts`、`use-badge` SWR hook 与 MSW mock（同步删除了镜像后端已废弃 `/card/:id` 契约的过期 mock）
