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
- GitHub Actions workflows for quality checks, coverage runs, static export build, and draft releases

### Changed

- Documentation has been rewritten to match the current repository implementation rather than the original generic starter-template description

### Documentation

- `README.md` now describes the real routes, modules, environment variables, and build behavior
- `README_zh.md` has been synced with the same implementation detail in Chinese
- `CI_CD.md` now reflects the actual workflow files and their enabled/disabled state
- `TESTING.md` now reflects the active Jest configuration and current test coverage layout
- `CONTRIBUTING.md` now reflects the actual contribution and validation expectations for this repo
