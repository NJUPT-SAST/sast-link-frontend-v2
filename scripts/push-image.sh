#!/usr/bin/env bash
#
# Build the frontend image and push it to the Tencent registry.
#
#   wsl -e bash scripts/push-image.sh              # build, verify, push
#   wsl -e bash scripts/push-image.sh --no-push    # build + verify only
#   wsl -e bash scripts/push-image.sh --verify-only  # re-check an existing local image
#
# Every NEXT_PUBLIC_* value below is baked into the static export at build time
# (next.config.ts uses output: "export"). They cannot be changed later with a
# .env file on the server — editing one means rebuilding and pushing again.
#
set -euo pipefail

REGISTRY="ccr.ccs.tencentyun.com"
IMAGE="${REGISTRY}/sast/sast-link-frontend-v2"

API_BASE_URL="https://link.sast.fun/v2"
FEISHU_CLIENT_ID="cli_aae6d1a7a1b99cc7"
# No /v2 prefix: the bind callbacks are frontend pages and the static export
# serves them at /oauth/bind/*, so these must match that path exactly.
FEISHU_BIND_REDIRECT_URI="https://link.sast.fun/oauth/bind/lark"
GITHUB_CLIENT_ID="Ov23limiZiha4G6jhQS2"
GITHUB_BIND_REDIRECT_URI="https://link.sast.fun/oauth/bind/github"

DO_BUILD=1
DO_PUSH=1
ASSUME_YES=0
for arg in "$@"; do
  case "$arg" in
    --no-push)     DO_PUSH=0 ;;
    --verify-only) DO_BUILD=0; DO_PUSH=0 ;;
    -y|--yes)      ASSUME_YES=1 ;;
    *) echo "unknown flag: $arg" >&2; exit 2 ;;
  esac
done

cd "$(dirname "$0")/.."
SHA="$(git rev-parse --short HEAD)"

echo "=============================================="
echo " image   : ${IMAGE}"
echo " tags    : ${SHA}, latest"
echo " api base: ${API_BASE_URL}"
echo "=============================================="

# A dirty tree means the :$SHA tag no longer identifies what is inside the
# image. Worth knowing before it lands in the registry under that name.
if ! git diff --quiet --ignore-all-space -- Dockerfile container.Caddyfile docker-compose.yml; then
  echo
  echo "WARNING: deploy files differ from commit ${SHA}:"
  git diff --stat --ignore-all-space -- Dockerfile container.Caddyfile docker-compose.yml | sed 's/^/  /'
  echo "  The :${SHA} tag will NOT match that commit. Commit first for a"
  echo "  traceable tag, or continue if this is a deliberate test build."
  echo
  if [ "$ASSUME_YES" = 1 ]; then
    echo "  (-y given, continuing)"
  elif [ ! -t 0 ]; then
    # No terminal to ask on. Refuse rather than guess — pass -y to override.
    echo "  Not a terminal, cannot confirm. Re-run with -y to accept."
    exit 1
  else
    printf "continue? [y/N] "
    read -r reply
    [ "$reply" = "y" ] || [ "$reply" = "Y" ] || { echo "aborted."; exit 1; }
  fi
fi

# ---------------------------------------------------------------- build
if [ "$DO_BUILD" = 1 ]; then
  echo
  echo ">>> building"
  docker build \
    --build-arg "NEXT_PUBLIC_API_BASE_URL=${API_BASE_URL}" \
    --build-arg "NEXT_PUBLIC_FEISHU_CLIENT_ID=${FEISHU_CLIENT_ID}" \
    --build-arg "NEXT_PUBLIC_FEISHU_BIND_REDIRECT_URI=${FEISHU_BIND_REDIRECT_URI}" \
    --build-arg "NEXT_PUBLIC_GITHUB_CLIENT_ID=${GITHUB_CLIENT_ID}" \
    --build-arg "NEXT_PUBLIC_GITHUB_BIND_REDIRECT_URI=${GITHUB_BIND_REDIRECT_URI}" \
    -t "${IMAGE}:${SHA}" \
    -t "${IMAGE}:latest" \
    --load .
  echo ">>> build ok"
fi

# ---------------------------------------------------------------- verify
# Cheap guards against the two ways this image has silently broken before:
# a build arg that never made it into the bundle, and the try_files rule that
# served index.html for every subroute.
echo
echo ">>> verifying ${IMAGE}:${SHA}"

fail=0

for v in "${API_BASE_URL}" "${FEISHU_CLIENT_ID}" "${GITHUB_CLIENT_ID}" \
         "${FEISHU_BIND_REDIRECT_URI}" "${GITHUB_BIND_REDIRECT_URI}"; do
  if docker run --rm "${IMAGE}:${SHA}" \
       sh -c "grep -rq '${v}' /var/www/_next/static/chunks/ 2>/dev/null"; then
    printf "  baked in   %s\n" "$v"
  else
    printf "  MISSING    %s\n" "$v"; fail=1
  fi
done

if docker run --rm --entrypoint sh "${IMAGE}:${SHA}" \
     -c 'grep -q "try_files {path} {path}.html" /etc/caddy/Caddyfile'; then
  echo "  try_files  has the {path}.html probe"
else
  echo "  BROKEN     try_files is missing {path}.html — subroutes will all"
  echo "             serve index.html"; fail=1
fi

# Serve the image and confirm a few routes return their own page rather than
# falling through to the index. Sizes differ per page, so index-sized bodies on
# a subroute mean the fallthrough bug is back.
echo "  route check:"
docker rm -f sast-link-frontend-v2-verify >/dev/null 2>&1 || true
docker run -d --name sast-link-frontend-v2-verify "${IMAGE}:${SHA}" >/dev/null
sleep 3

index_size=$(docker exec sast-link-frontend-v2-verify \
  sh -c 'wget -qO- http://127.0.0.1:80/ 2>/dev/null | wc -c')

for route in /login /register /reset /home /profile /profile/edit \
             /settings /settings/password /settings/apps \
             /admin /admin/users /admin/audit-logs /admin/oauth-clients \
             /oauth/callback /oauth/consent /oauth/bind/lark /oauth/bind/github; do
  size=$(docker exec sast-link-frontend-v2-verify \
    sh -c "wget -qO- http://127.0.0.1:80${route} 2>/dev/null | wc -c")
  if [ "$size" = "0" ]; then
    printf "    %-22s EMPTY\n" "$route"; fail=1
  elif [ "$size" = "$index_size" ]; then
    printf "    %-22s served index.html (%s bytes)\n" "$route" "$size"; fail=1
  else
    printf "    %-22s ok (%s bytes)\n" "$route" "$size"
  fi
done

docker rm -f sast-link-frontend-v2-verify >/dev/null 2>&1 || true

if [ "$fail" != 0 ]; then
  echo
  echo ">>> verification FAILED — nothing pushed"
  exit 1
fi
echo ">>> verification passed"

# ---------------------------------------------------------------- push
if [ "$DO_PUSH" = 0 ]; then
  echo
  echo "skipping push. Local tags ready: ${IMAGE}:${SHA}, ${IMAGE}:latest"
  exit 0
fi

echo
echo ">>> pushing"
# Credentials expire (Docker Desktop drops the logon session). Turn that into a
# clear instruction rather than a raw "error getting credentials" dump.
if ! docker push "${IMAGE}:${SHA}"; then
  echo
  echo "Push failed. If the error mentions credentials or a logon session, run:"
  echo "    docker login ${REGISTRY}"
  echo "then re-run this script (it will reuse the built image)."
  exit 1
fi
docker push "${IMAGE}:latest"

echo
echo ">>> remote digests"
for tag in "${SHA}" latest; do
  digest=$(docker manifest inspect "${IMAGE}:${tag}" 2>/dev/null \
    | grep -m1 '"digest"' | sed 's/.*sha256:\([0-9a-f]\{12\}\).*/sha256:\1…/')
  printf "  %-12s %s\n" "$tag" "${digest:-unavailable}"
done

cat <<EOF

Pushed. On the server:

    cd /data/sast-link-frontend-v2
    docker pull ${IMAGE}:${SHA}
    docker image inspect ${IMAGE}:current >/dev/null 2>&1 \\
      && docker tag ${IMAGE}:current ${IMAGE}:backup
    docker tag ${IMAGE}:${SHA} ${IMAGE}:current
    docker compose up -d --remove-orphans

Rollback: docker tag ${IMAGE}:backup ${IMAGE}:current && docker compose up -d
EOF
