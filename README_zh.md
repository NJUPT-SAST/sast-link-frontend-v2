# SAST Link Next

SAST Link 账户系统的 Next.js 16 实现：登录、注册、重置密码、OAuth 回调和用户主页。

[English](./README.md)

## 技术栈

Next.js 16 App Router（`output: "export"` 静态导出）· React 19 · TypeScript · Tailwind CSS v4 · shadcn/ui · Zustand · SWR + Axios · Jest 30 + Testing Library + MSW

## 路由

- 游客：`/` 账号切换 · `/login` · `/register` · `/reset` · `/oauth/callback`(登录落地页)
- 登录后：`/home` · `/settings` · `/settings/edit` —— `app/(user)/layout.tsx` 在没有 token 时跳转 `/login`。
- OAuth 绑定回调：`/oauth/bind/lark` · `/oauth/bind/github`(前端拼授权 URL，回调回前端)
- 管理员：`/admin/users` · `/admin/oauth-clients` · `/admin/audit-logs`

## 开发

Node.js 20+，pnpm。

```bash
pnpm install
pnpm dev        # http://localhost:3000
```

`.env.local`：

```env
# 本地联调：直连后端 8080（后端需在 CORS_ALLOWED_ORIGINS 里放行 http://localhost:3000）
NEXT_PUBLIC_API_BASE_URL=http://localhost:8080
# OAuth 绑定（登录落地与绑定回调需后端契约配合，值见后端 OAUTH_* 配置）
NEXT_PUBLIC_FEISHU_CLIENT_ID=
NEXT_PUBLIC_FEISHU_BIND_REDIRECT_URI=http://localhost:3000/oauth/bind/lark
NEXT_PUBLIC_GITHUB_CLIENT_ID=
NEXT_PUBLIC_GITHUB_BIND_REDIRECT_URI=http://localhost:3000/oauth/bind/github
```

- `NEXT_PUBLIC_API_BASE_URL` 直指后端地址；本地开发直接连 8080（后端带 `CORS_ALLOWED_ORIGINS` 白名单校验）。
- `NEXT_PUBLIC_*` 在构建时写进 bundle，别放 secret。

## 命令

| 命令 | 说明 |
| --- | --- |
| `pnpm dev` | 开发服务器，端口 3000 |
| `pnpm build` | 静态导出到 `out/` |
| `pnpm lint` | ESLint |
| `pnpm test` | Jest |
| `pnpm test:watch` | Jest 监听模式 |
| `pnpm test:coverage` | Jest 覆盖率 |

## 目录

```text
app/          # 路由、布局、providers，测试与页面同目录
components/   # 共享 UI：auth、layout、motion、feedback、ui 基础组件
hooks/        # 共享 hooks（use-fetch-profile）
lib/          # api/（Axios client 与 auth/user/oauth 封装）、校验、token、全局提示
mocks/        # MSW handlers
store/        # Zustand stores（账号列表、资料、面板）
```

## 更多文档

- [TESTING.md](./TESTING.md) —— 测试策略
- [CI_CD.md](./CI_CD.md) —— GitHub Actions 工作流
- [CONTRIBUTING.md](./CONTRIBUTING.md) —— 协作流程
