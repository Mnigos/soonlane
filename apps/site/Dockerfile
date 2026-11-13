# Built from the repo root (Railway's `dockerfilePath`): Bun prerenders the site, Caddy serves the files.
FROM oven/bun:1.4.2-alpine@sha256:d888c0ae6c86d7866ff10c5aafdd9077b36aee6455b33dd270fb93c0dd5cef6f AS build

# Railway passes service variables to a Dockerfile build only as declared build arguments.
ARG APP_ENV
ARG VITE_POSTHOG_KEY
ARG RAILWAY_GIT_COMMIT_SHA
# Without APP_ENV the build is a development site (robots block everything, links go to localhost) that still passes /health.
RUN test -n "$APP_ENV" || { echo 'APP_ENV is not set; the site service needs it (docs/deploy-railway.md)' >&2; exit 1; }

WORKDIR /repo
COPY . .
RUN bun install --frozen-lockfile
RUN bun run --cwd apps/site build

FROM caddy:2.10.2-alpine@sha256:4c6e91c6ed0e2fa03efd5b44747b625fec79bc9cd06ac5235a779726618e530d

COPY apps/site/Caddyfile /etc/caddy/Caddyfile
COPY --from=build /repo/apps/site/dist/client /srv
