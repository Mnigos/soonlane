# Deploy on Vercel

The app runs as the Vercel project `soonlist` (team `mnigos-projects`) connected to `Mnigos/soonlist`. Production is https://soonlist.vercel.app from branch `main`; every other branch gets a preview deployment. The build configuration is in `apps/web/vercel.json`:

- `installCommand`: `bun install --frozen-lockfile`; Bun installs the whole workspace from `bun.lock` in the repository root, even when the command starts in `apps/web`;
- `buildCommand`: `bun run build`;
- `framework: null`: Vite builds the app for Node.js, and Nitro (preset `vercel`) writes the result to `apps/web/.vercel/output` in the Build Output API v3 format: static files in `static/` and one function `functions/__server.func` with the `nodejs22.x` runtime, a `maxDuration` of 60 s and the region `fra1` (set in `apps/web/vite.config.ts`, next to the Neon database in `eu-central-1`).

Preview builds are not skipped.

## Project settings

- **Root Directory**: `apps/web`, with **Include files outside of the Root Directory in the Build Step** enabled (the build reads `packages/*` and `bun.lock` from the root).
- **Framework Preset**: Other. The install and build commands come from `vercel.json`; do not override them in the dashboard.
- **Node.js Version**: `22.x`.
- Leave **Automatically expose System Environment Variables** enabled: `VERCEL_GIT_COMMIT_SHA` is the version `system.health` reports, and `VERCEL_URL` / `VERCEL_BRANCH_URL` give previews their base URL and trusted origins.

## Environment variables

| Variable    | Production                    | Preview                      | Development             |
| ----------- | ----------------------------- | ---------------------------- | ----------------------- |
| `AUTH_URL`  | `https://soonlist.vercel.app` | unset (derived, see below)   | `http://localhost:3000` |

Without `AUTH_URL` the base URL is `https://$VERCEL_BRANCH_URL`, then `https://$VERCEL_URL`. Requests to `/api/rpc` are accepted from the base URL and from both Vercel hosts of the deployment.

## Local environment

```sh
bunx vercel@latest env pull apps/web/.env.local --environment=development --scope mnigos-projects --yes
```

The file is git-ignored. Never print it.

## Checks after a deployment

```sh
curl -s -X POST -H 'content-type: application/json' -d '{"json":null}' https://soonlist.vercel.app/api/rpc/system/health
# {"json":{"ok":true,"version":"<commit sha>"}}
```
