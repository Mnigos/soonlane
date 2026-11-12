# Deploy on Railway

The API (`apps/api`) runs as the service `api` in the Railway project `Soonlane`, with one replica in Amsterdam (`europe-west4-drams3a`). Two environments: `production` at https://api.soonlane.com and `staging` at https://api.staging.soonlane.com ([ADR 0013](decisions/0013-three-hosts-on-railway.md)). It serves Better Auth (`/api/auth/*`), the oRPC API (`/api/rpc/*`) and the calendar feed (`/calendar/*`). The web app still deploys on Vercel; its pages call this host from the browser with credentials and from SSR with the proxy secret ([deploy-vercel.md](deploy-vercel.md)). Staging has its own Railway Postgres (the `Postgres` service, same region, volume `postgres-volume`), reached at `postgres.railway.internal`; production uses Neon until its data moves to Railway.

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
| `AUTH_COOKIE_PREFIX` | `soonlane`              | `soonlane-staging`                 |
| `AUTH_COOKIE_DOMAIN` | `soonlane.com`          | `staging.soonlane.com`             |
| `DATABASE_URL`    | Neon `main`, direct, entered by hand | `${{Postgres.DATABASE_URL}}` |
| `AUTH_SECRET`          | secret, at least 32 characters | its own secret                 |
| `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` | the OAuth client | the same client           |
| `API_PROXY_SECRET`     | secret, also on Vercel Production | its own secret, also on Vercel's `staging` branch |
| `ALLOWED_EMAILS`       | optional                   | optional                           |
| `POSTHOG_KEY`          | optional, the PostHog project key | optional                    |

`.railway/railway.ts` sets the plain values and marks the secrets `preserve()`, so an apply keeps what was entered by hand. `TRUSTED_ORIGINS` is a comma-separated list of exact origins that may call `/api/auth` and `/api/rpc` from the browser (CORS with credentials) and that sign-in may return to; any other `Origin` gets 403. `API_URL` is the API's public origin: Better Auth's base URL (Google returns to `<API_URL>/api/auth/callback/google`) and the host of calendar links. `APP_URL` is the web app's: Better Auth sends its errors to `<APP_URL>/login`, and the feed's events link there. `AUTH_COOKIE_PREFIX` names every cookie and must equal the web build's `VITE_AUTH_COOKIE_PREFIX`; `AUTH_COOKIE_DOMAIN` is the domain the cookies cover, so the web app's host receives them. Production's cookies cover `soonlane.com`, so the browser sends them to the staging hosts too: the staging API receives a production session token on every browser call from someone signed in to production. Staging's Better Auth ignores them, because its prefix and its `AUTH_SECRET` differ, and its web server forwards only `soonlane-staging.*` cookies, but only during server rendering; nothing filters the browser's direct calls. Code deployed to staging could copy that token, so staging runs only trusted refs, and the API never logs the cookie header. The commit comes from `RAILWAY_GIT_COMMIT_SHA` on GitHub deploys. `railway up` uploads no git metadata, so the staging workflow writes `APP_COMMIT=<sha>` to `apps/api/commit.env` (gitignored, kept in the upload by `.railwayignore`) and the build inlines it into the bundle, ignoring any `APP_COMMIT` variable, so the commit always belongs to the uploaded code. The API refuses to start when a variable is missing or malformed and names it in the log.

Locally the API reads `apps/api/.env.local` (Bun loads it from the working directory): the same names, with `PORT=8080`, `APP_ENV=development`, `API_URL=http://localhost:8080`, `APP_URL` and `TRUSTED_ORIGINS` `http://localhost:3000`, `AUTH_COOKIE_PREFIX=soonlane-dev` and no `AUTH_COOKIE_DOMAIN` (localhost cookies reach every port), any `APP_COMMIT`, and an `API_PROXY_SECRET` equal to the web app's.

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

## CORS and return addresses

The browser calls `/api/auth` and `/api/rpc` directly. Checks on staging:

```sh
# a trusted origin's preflight: 204 with that exact origin, credentials, GET, POST, content-type, max-age 7200, Vary: Origin
curl -si -X OPTIONS -H 'Origin: https://staging.soonlane.com' -H 'Access-Control-Request-Method: POST' https://api.staging.soonlane.com/api/rpc/identity/me
# another subdomain, production's origin or the API's own: 403 for the preflight and the request
curl -s -o /dev/null -w '%{http_code}\n' -X POST -H 'Origin: https://evil.staging.soonlane.com' -H 'content-type: application/json' -d '{"json":null}' https://api.staging.soonlane.com/api/rpc/identity/me
# return addresses: a relative path, the API host or no body callbackURL is 400; a foreign host is Better Auth's 403
curl -s -X POST -H 'Origin: https://staging.soonlane.com' -H 'content-type: application/json' -d '{"provider":"google","callbackURL":"/app"}' https://api.staging.soonlane.com/api/auth/sign-in/social
```

A deploy replaces the API before the web app, so for a few minutes a page loaded from the previous web build may call the new API: harmless while the cookie names and origins stay the same, but a change to either signs those tabs out until they reload. A cached preflight (2 hours in Chrome, up to a day in Firefox) can hide a CORS change; test in a fresh profile.

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
