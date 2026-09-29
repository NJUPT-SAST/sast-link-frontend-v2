# Changelog

All notable changes to this repository should be documented here.

The format loosely follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and the version field should continue following Semantic Versioning if formal releases are published.

## [Unreleased]

### Fixed

- Dependency security sweep: `next` 16.3.4→16.3.6 (carries the GHSA-vcvr-r3jv-pc5j fix for RCE in next/og ImageResponse), and the pnpm overrides bumped `fast-uri` to 3.1.6 (four SSRF/host-confusion advisories reaching ajv-formats) and `js-yaml` to 3.15.2 (CPU exhaustion via jest's istanbul toolchain) — clears all five remaining high-severity Dependabot alerts

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

- Routine dependency bumps: `lucide-react` 1.48.0 (new icons), `eslint-config-next` 16.3.6, `jest` / `jest-environment-jsdom` 30.5.2
- Registration email step: typing or pasting a full whitelisted address (`xx@njupt.edu.cn` / `xx@sast.fun`) now splits into prefix + domain capsule instead of failing on the `@` rule; foreign domains stay in the prefix and fail with a visible error (previously the send-code button no-opped silently — react-hook-form's `trigger()` drops nested object-field errors, so the validation failure never rendered)
- Registration locks the email address and domain capsule once the verification code is sent (changing the target afterwards desynced the code from its mailbox)
- A foreign `?email=` prefill (e.g. an OAuth `other_mail`) starts the registration form blank instead of mounting an `@`-in-prefix error state
- Registration email field hints now preview the exact normalized send target (「将发送验证码到 …」) instead of the login copy (「将使用 … 继续」), and use `autoComplete="email"`
- Login account field: visible label is programmatically associated with the input (click-to-focus), and the input disables iOS autocapitalize/autocorrect/spellcheck
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

- **个人徽标分享**（feat/card-badge）：设置页新增「个人徽标」区块——开关式分享一枚可嵌入任意网页（GitHub README、友链列表）的 SVG 身份卡片，链接即凭证（后端随机 capability key，不可枚举）。尺寸/主题/跳转三分段式选择器 + 实时预览（直连公开渲染端点，可点击跳转个人主页：博客或 GitHub 由用户显式选择，作为 `target` 参数随链接携带、可被嵌入者手改；预览下方 caption 标明点击去向），一键复制链接；关闭需确认弹窗（警示嵌入链接立即失效，重新开启后原链接恢复可用——开关不轮换 key）。选择的跳转目标未配置时徽标不可点击，caption 报缺并引导去资料页设置，不做静默回退。配套 `lib/api/badge.ts`、`use-badge` SWR hook 与 MSW mock（同步删除了镜像后端已废弃 `/card/:id` 契约的过期 mock）
