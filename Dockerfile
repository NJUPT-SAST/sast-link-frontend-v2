# Stage 1: Build
# Node 20 reached EOL 2026-04-30; 22 is the current LTS line.
FROM node:22-alpine AS builder

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable && corepack prepare pnpm@10.30.3 --activate

WORKDIR /app

# The frontend talks to the backend directly. The API base URL is injected at
# build time so the same image can move between environments.
ARG NEXT_PUBLIC_API_BASE_URL=http://localhost:8080
ENV NEXT_PUBLIC_API_BASE_URL=${NEXT_PUBLIC_API_BASE_URL}

# OAuth bind runs entirely in the browser: the authorize URL is assembled from
# these values, so they must be baked in at build time. Without a client id
# buildBindOAuthUrl() returns null and the bind buttons go dead.
ARG NEXT_PUBLIC_FEISHU_CLIENT_ID
ENV NEXT_PUBLIC_FEISHU_CLIENT_ID=${NEXT_PUBLIC_FEISHU_CLIENT_ID}
ARG NEXT_PUBLIC_FEISHU_BIND_REDIRECT_URI
ENV NEXT_PUBLIC_FEISHU_BIND_REDIRECT_URI=${NEXT_PUBLIC_FEISHU_BIND_REDIRECT_URI}
ARG NEXT_PUBLIC_GITHUB_CLIENT_ID
ENV NEXT_PUBLIC_GITHUB_CLIENT_ID=${NEXT_PUBLIC_GITHUB_CLIENT_ID}
ARG NEXT_PUBLIC_GITHUB_BIND_REDIRECT_URI
ENV NEXT_PUBLIC_GITHUB_BIND_REDIRECT_URI=${NEXT_PUBLIC_GITHUB_BIND_REDIRECT_URI}

# pnpm-workspace.yaml carries the `overrides` block that is baked into the
# lockfile — omitting it makes --frozen-lockfile fail with a config mismatch.
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile

COPY . .
RUN pnpm build

# Stage 2: Serve
FROM caddy:alpine

COPY --from=builder /app/out /var/www
COPY container.Caddyfile /etc/caddy/Caddyfile

EXPOSE 80

CMD ["caddy", "run", "--config", "/etc/caddy/Caddyfile"]
