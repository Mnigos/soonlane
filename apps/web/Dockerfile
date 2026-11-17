# Built from the repo root by the Images workflow; `self-host/compose.yaml` runs it behind a proxy that serves the API on the same origin.
FROM --platform=$BUILDPLATFORM oven/bun:1.4.2-alpine@sha256:d888c0ae6c86d7866ff10c5aafdd9077b36aee6455b33dd270fb93c0dd5cef6f AS build

ARG APP_COMMIT=dev
# Baked into the bundle: an empty API URL makes the browser call the API on the page's own origin, so one image fits every host.
ENV APP_ENV=production \
	VITE_API_URL="" \
	VITE_AUTH_COOKIE_PREFIX=soonlane \
	VITE_LANDING_URL=https://soonlane.com

WORKDIR /repo
COPY . .
RUN bun install --frozen-lockfile
RUN echo "APP_COMMIT=$APP_COMMIT" > apps/web/commit.env && bun run --cwd apps/web build

FROM oven/bun:1.4.2-alpine@sha256:d888c0ae6c86d7866ff10c5aafdd9077b36aee6455b33dd270fb93c0dd5cef6f

WORKDIR /app
COPY --from=build /repo/apps/web/.output ./

USER bun
ENV PORT=8080
EXPOSE 8080
CMD ["bun", "server/index.mjs"]
