# Built from the repo root by the Images workflow; `self-host/compose.yaml` runs it. The bundles are plain JavaScript, so the build stage runs once on the build machine for every platform.
FROM --platform=$BUILDPLATFORM oven/bun:1.4.2-alpine@sha256:d888c0ae6c86d7866ff10c5aafdd9077b36aee6455b33dd270fb93c0dd5cef6f AS build

ARG APP_COMMIT=dev

WORKDIR /repo
COPY . .
RUN bun install --frozen-lockfile
RUN echo "APP_COMMIT=$APP_COMMIT" > apps/api/commit.env && bun run --cwd apps/api build
# The migrator finds `migrations` next to its own file, so the bundle sits beside the copied folder.
RUN bun build packages/db/scripts/migrate.ts --target=bun --outfile=/out/migrate.js

FROM oven/bun:1.4.2-alpine@sha256:d888c0ae6c86d7866ff10c5aafdd9077b36aee6455b33dd270fb93c0dd5cef6f

WORKDIR /app
COPY --from=build /repo/apps/api/dist ./
COPY --from=build /out/migrate.js ./
COPY --from=build /repo/packages/db/migrations ./migrations

USER bun
ENV PORT=8080
EXPOSE 8080
# Pending migrations run in one transaction before the server starts, as Railway's pre-deploy runs them.
CMD ["sh", "-c", "bun migrate.js && exec bun main.js"]
