# Deploy on Railway

The API (`apps/api`) runs as the service `api` in the Railway project `Soonlane`, with one replica in Amsterdam (`europe-west4-drams3a`). Two environments: `production` at https://api.soonlane.com and `staging` at https://api.staging.soonlane.com ([ADR 0013](decisions/0013-three-hosts-on-railway.md)). It serves Better Auth (`/api/auth/*`), the oRPC API (`/api/rpc/*`) and the calendar feed (`/calendar/*`). The web app still deploys on Vercel and forwards `/api/auth` and `/api/rpc` here ([deploy-vercel.md](deploy-vercel.md)). Staging has its own Railway Postgres (the `Postgres` service, same region, volume `postgres-volume`), reached at `postgres.railway.internal`; production uses Neon until its data moves to Railway.

## Configuration

`.railway/railway.ts` defines the service for both environments: Railpack builds from the repository root (`bun install --frozen-lockfile`, Bun 1.4.2 from `packageManager`), runs `bun run --cwd apps/api build`, runs the migrator as the pre-deploy command (below) and starts `bun apps/api/dist/main.js`. Railway calls `GET /health` until it answers 2xx before it switches traffic, and gives the old deployment 10 seconds to finish its requests after SIGTERM.

Railway reads the file only when someone applies it, never during a deploy. After changing it, from a directory linked to the project:

```sh
bunx @railway/cli config plan --file <repo>/.railway/railway.ts --environment staging
bunx @railway/cli config apply --file <repo>/.railway/railway.ts --environment staging
```

and the same for `production`. The file exports `partial = 'soonlane'`, so an apply touches only what the file declares: staging's Postgres, not production's, and nothing created by hand. Every variable of the service is managed by the file: a variable the file does not declare is deleted on apply, unless the file marks it `preserve()`. Custom domains must exist in Railway before the file can declare them (`railway domain <host> --port 8080`).

## Variables

| Variable          | Production                 | Staging                            |
| ----------------- | -------------------------- | ---------------------------------- |
| `PORT`            | `8080`                     | `8080`                             |
| `APP_ENV`         | `production`               | `staging`                          |
| `API_URL`         | `https://api.soonlane.com` | `https://api.staging.soonlane.com` |
| `APP_URL`              | `https://soonlane.com`     | `https://staging.soonlane.com`     |
| `TRUSTED_ORIGINS` | `https://soonlane.com`     | `https://staging.soonlane.com`     |
| `DATABASE_URL`    | Neon `main`, direct, entered by hand | `${{Postgres.DATABASE_URL}}` |
| `AUTH_SECRET`          | secret, at least 32 characters | its own secret                 |
| `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` | the OAuth client | the same client           |
| `API_PROXY_SECRET`     | secret, also on Vercel Production | its own secret, also on Vercel's `staging` branch |
| `ALLOWED_EMAILS`       | optional                   | optional                           |
| `POSTHOG_KEY`          | optional, the PostHog project key | optional                    |

`.railway/railway.ts` sets the plain values and marks the secrets `preserve()`, so an apply keeps what was entered by hand. `TRUSTED_ORIGINS` is a comma-separated list of origins that may call `/api/rpc` and Better Auth with an `Origin` header. `API_URL` is the API's public origin (calendar links); `APP_URL` is the web app's, which is Better Auth's base URL in this stage (Google returns there and the web app forwards the callback) and the target of the feed's event links. The commit comes from `RAILWAY_GIT_COMMIT_SHA` on GitHub deploys. `railway up` uploads no git metadata, so the staging workflow writes `APP_COMMIT=<sha>` to `apps/api/commit.env` (gitignored, kept in the upload by `.railwayignore`) and the build inlines it into the bundle, ignoring any `APP_COMMIT` variable, so the commit always belongs to the uploaded code. The API refuses to start when a variable is missing or malformed and names it in the log.

Locally the API reads `apps/api/.env.local` (Bun loads it from the working directory): the same names, with `PORT=8080`, `APP_ENV=development`, `API_URL=http://localhost:8080`, `APP_URL` and `TRUSTED_ORIGINS` `http://localhost:3000`, any `APP_COMMIT`, and an `API_PROXY_SECRET` equal to the web app's.

## Migrations

The pre-deploy command `bun packages/db/scripts/migrate.ts` applies the Drizzle migrations from `packages/db/migrations` to `DATABASE_URL_UNPOOLED`, or `DATABASE_URL` without it. It runs in the built image after the build and before the new deployment takes traffic, where the private network is reachable. When it fails, the deployment fails and the previous one keeps serving; the pending migrations run in one transaction, so a failure leaves none of them applied. A change under `packages/db` deploys production, so a merged migration reaches it.

The web app's `staging` branch calls the staging API, so it uses staging's Postgres; other Vercel previews call no API. Nothing migrates the Neon `preview` branch, which only local development uses; run `bun run db:migrate` after a new migration ([deploy-vercel.md](deploy-vercel.md)).

## Client IP

Better Auth's rate limits count per client IP, which the API's entry settles (`ARCHITECTURE.md`, Client IP): the visitor IP the web server sends with the proxy secret, otherwise `X-Real-IP` from Railway's edge, or `CF-Connecting-IP` when `X-Real-IP` is a Cloudflare edge address (production's host is proxied by Cloudflare, staging's is DNS only). Checks on staging, with `curl -4`:

```sh
# a wrong secret is refused
curl -s -o /dev/null -w '%{http_code}\n' -H 'x-soonlane-proxy-secret: wrong' https://api.staging.soonlane.com/api/auth/get-session
# 403
# forged headers do not change the rate-limit key, which holds the caller's real IP (curl -4 ifconfig.me)
curl -s -H 'X-Real-IP: 203.0.113.9' -H 'X-Forwarded-For: 203.0.113.9' -H 'CF-Connecting-IP: 203.0.113.9' https://api.staging.soonlane.com/api/auth/get-session
```

## Staging

Staging has no repository connected, so a push deploys nothing. To deploy a branch, tag or commit, run the **Deploy staging** workflow (Actions, or `gh workflow run deploy-staging.yml -f ref=<ref>`). It checks out the ref, writes its commit into `apps/api/commit.env`, runs `railway up` with the `RAILWAY_TOKEN_STAGING` secret and waits until the deployment passes its health check. Then it force-pushes the same ref to the branch `staging`, which Vercel serves on https://staging.soonlane.com ([deploy-vercel.md](deploy-vercel.md)), so the API is always at least as new as the web app. Then:

```sh
curl https://api.staging.soonlane.com/health
# {"ok":true,"environment":"staging","commit":"<sha>"}
```

## Production

Production builds `main` through Railway's GitHub connection with **Wait for CI**: Railway holds each push to `main` until the CI workflow on that commit has finished, skips the deploy if it failed, and deploys only when a watched path changed (`apps/api`, the `analytics`, `auth`, `contracts`, `db` and `domain` packages, `version.json`, `tooling/typescript-config`, the root `package.json`, `bun.lock`, `bunfig.toml`). Nothing else deploys production; never run `railway up` against it.

## DNS

Records in Cloudflare (`soonlane.com` zone). `api.soonlane.com` is proxied, with SSL mode Full (not Full (strict)); `api.staging.soonlane.com` stays DNS only, since Cloudflare's universal certificate does not cover a host two levels deep. Nothing depends on Railway's generated `*.up.railway.app` host: the deploy health check runs inside Railway and the staging workflow reads the deployment status.

| Host                       | Type  | Name                          | Value                                                                  | Proxy     |
| -------------------------- | ----- | ----------------------------- | ---------------------------------------------------------------------- | --------- |
| `api.soonlane.com`         | CNAME | `api`                         | `dw86xh7f.up.railway.app`                                              | Proxied   |
| `api.soonlane.com`         | TXT   | `_railway-verify.api`         | `railway-verify=…` (`railway domain status api.soonlane.com`)          | DNS only  |
| `api.staging.soonlane.com` | CNAME | `api.staging`                 | `8jedkcb7.up.railway.app`                                              | DNS only  |
| `api.staging.soonlane.com` | TXT   | `_railway-verify.api.staging` | `railway-verify=…` (`railway domain status api.staging.soonlane.com`)  | DNS only  |
