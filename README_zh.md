# SAST Link Frontend V2

SAST Link 账号体系的前端：登录、注册、密码重置、OAuth 回调、用户主页和管理台，基于 Next.js 16。

<div align="center">

[![CI](https://github.com/NJUPT-SAST/sast-link-frontend-v2/actions/workflows/ci.yml/badge.svg)](https://github.com/NJUPT-SAST/sast-link-frontend-v2/actions/workflows/ci.yml)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

[English](README.md) | [简体中文](README_zh.md)

</div>

## 快速开始

需要 Node.js 20+ 和 pnpm。

```bash
pnpm install
pnpm dev        # http://localhost:3000
```

前端没有后端就是空壳，`NEXT_PUBLIC_API_BASE_URL` 决定它连哪个后端：

- `/v2` —— dev 下 `next.config.ts` 把 `/v2/*` 代理到 `https://link.sast.fun`（生产后端），浏览器视角同源。**这是 httpOnly cookie 会话能工作的模式**（见下面的"会话"）。
- `http://localhost:8080` —— 直连本地后端，跨源。登录能用，但新 tab 的 cookie bootstrap 失效，已登录的浏览器开新 tab 会看到登录页。

把 `.env.example` 拷成 `.env.local`，填上 OAuth client id：

```env
NEXT_PUBLIC_API_BASE_URL=/v2
NEXT_PUBLIC_FEISHU_CLIENT_ID=
NEXT_PUBLIC_FEISHU_BIND_REDIRECT_URI=http://localhost:3000/oauth/bind/lark
NEXT_PUBLIC_GITHUB_CLIENT_ID=
NEXT_PUBLIC_GITHUB_BIND_REDIRECT_URI=http://localhost:3000/oauth/bind/github
```

`NEXT_PUBLIC_*` 在构建时写死进静态包，别放密钥。

## 特性

- **登录与账号**：密码登录、两步注册、密码重置、GitHub/飞书登录
- **OAuth IdP 前端**：第三方应用的授权确认页、已授权应用管理、GitHub/飞书绑定回调
- **tab 共享一个会话**：refresh token 只存在后端 httpOnly cookie 里；新 tab 用 cookie 调 `POST /auth/refresh` 重建会话——登录过的浏览器开新 tab 不会被踢回登录页
- **管理台**：用户搜索/编辑/删除、OAuth 客户端注册、审计日志
- **静态导出**：`output: "export"`，部署在 Caddy 反代后面

## 会话

access token 短命（1h）放 `sessionStorage`；refresh token 不进 JS，后端写在 httpOnly `sl_session` cookie（`Path=/v2`、`SameSite=Lax`）。新 tab 和 OAuth authorize→consent 流程都从 cookie bootstrap。一个 tab 登出会撤销整个会话族，并通过 `storage` 事件让其他 tab 同步失效。

代价：这套依赖前后端同源，所以 `/v2` 是推荐模式。我们为此放弃了 localStorage 共享 token——在身份中心上，能被脚本读走的 refresh token 就等于整个账号。

## 更多文档

- [TESTING.md](./TESTING.md) —— 测试策略和命令
- [CI_CD.md](./CI_CD.md) —— GitHub Actions 工作流
- [CONTRIBUTING.md](./CONTRIBUTING.md) —— 贡献流程

## 开发

```bash
pnpm lint
pnpm test
pnpm build       # 静态导出到 out/
```

## 许可证

[MIT](./LICENSE) © NJUPT SAST
