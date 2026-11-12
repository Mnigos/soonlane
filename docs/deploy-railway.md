# Deploy on Railway

Soonlane runs as two services in the Railway project `Soonlane`, each with one replica in Amsterdam (`europe-west4-drams3a`), in two environments ([ADR 0013](decisions/0013-three-hosts-on-railway.md)). `api` (`apps/api`) serves Better Auth (`/api/auth/*`), the oRPC API (`/api/rpc/*`) and the calendar feed (`/calendar/*`) at https://api.soonlane.com and https://api.staging.soonlane.com. `web` (`apps/web`) is a Bun server for the landing, the blog, the changelog, the legal pages and the app under `/app` at https://soonlane.com and https://staging.soonlane.com; its pages call the API from the browser with credentials and from server rendering over the private network with the proxy secret ([Web app](#web-app)). Staging has its own Railway Postgres (the `Postgres` service, same region, volume `postgres-volume`), reached at `postgres.railway.internal`; production uses Neon until its data moves to Railway.

## Configuration

`.railway/railway.ts` defines both services for both environments. For `api`, Railpack builds from the repository root (`bun install --frozen-lockfile`, Bun 1.4.2 from `packageManager`), runs `bun run --cwd apps/api build`, runs the migrator as the pre-deploy command (below) and starts `bun apps/api/dist/main.js`. Railway calls `GET /health` until it answers 2xx before it switches traffic, and gives the old deployment 30 seconds after SIGTERM: the API stops accepting requests, waits up to 15 seconds for those in flight, flushes queued analytics events and closes the database pool (`apps/api/src/main.ts`). The API listens on `::`, so the private network reaches it over IPv6 as well as IPv4.

For `web`, Railpack runs `bun run --cwd apps/web build`, which ends by checking the built server, and starts `bun apps/web/.output/server/index.mjs` with `CI` unset, because Railpack sets `CI=true` at run time and the server then skips its graceful shutdown. Railway calls its `GET /health`, which needs neither the API nor the database. On SIGTERM the server stops accepting connections and waits up to 15 seconds (`SERVER_SHUTDOWN_TIMEOUT`) for requests in flight, then closes them within 5 more; the 30 seconds of draining cover both.

Railway reads the file only when someone applies it, never during a deploy. After changing it, from a directory linked to the project, with the CLI installed as `railway` (`bun add -g @railway/cli@5.71.0`):

```sh
railway config plan --file <repo>/.railway/railway.ts --environment staging
railway config apply --file <repo>/.railway/railway.ts --environment staging
```

and the same for `production`. Run the binary itself, not `bunx @railway/cli`: `railway/iac` checks the CLI version by running `$_ --version`, which under `bunx` is Bun, and refuses the file. The file exports `partial = 'soonlane'`, so an apply touches only what the file declares: staging's Postgres, not production's, and nothing created by hand. Every variable of the service is managed by the file: a variable the file does not declare is deleted on apply, unless the file marks it `preserve()`. Custom domains must exist in Railway before the file can declare them (`railway domain <host> --service <service> --environment <environment> --port 8080`), and a service must exist before its domain; both services exist in both environments now.

## Variables

The `api` service:

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
| `API_PROXY_SECRET`     | secret, the web server's too | its own secret, the web server's too |
| `ALLOWED_EMAILS`       | optional                   | optional                           |
| `POSTHOG_KEY`          | optional, the PostHog project key | optional                    |

`.railway/railway.ts` sets the plain values and marks the secrets `preserve()`, so an apply keeps what was entered by hand. `TRUSTED_ORIGINS` is a comma-separated list of exact origins that may call `/api/auth` and `/api/rpc` from the browser (CORS with credentials) and that sign-in may return to; any other `Origin` gets 403. `API_URL` is the API's public origin: Better Auth's base URL (Google returns to `<API_URL>/api/auth/callback/google`) and the host of calendar links. `APP_URL` is the web app's: Better Auth sends its errors to `<APP_URL>/login`, and the feed's events link there. `AUTH_COOKIE_PREFIX` names every cookie and must equal the web build's `VITE_AUTH_COOKIE_PREFIX`; `AUTH_COOKIE_DOMAIN` is the domain the cookies cover, so the web app's host receives them. Production's cookies cover `soonlane.com`, so the browser sends them to the staging hosts too: the staging API receives a production session token on every browser call from someone signed in to production. Staging's Better Auth ignores them, because its prefix and its `AUTH_SECRET` differ, and its web server forwards only `soonlane-staging.*` cookies, but only during server rendering; nothing filters the browser's direct calls. Code deployed to staging could copy that token, so staging runs only trusted refs, and the API never logs the cookie header. The commit comes from `RAILWAY_GIT_COMMIT_SHA` on GitHub deploys. `railway up` uploads no git metadata, so the staging workflow writes `APP_COMMIT=<sha>` to `apps/api/commit.env` (gitignored, kept in the upload by `.railwayignore`) and the build inlines it into the bundle, ignoring any `APP_COMMIT` variable, so the commit always belongs to the uploaded code. The API refuses to start when a variable is missing or malformed and names it in the log.

Locally the API reads `apps/api/.env.local` (Bun loads it from the working directory): the same names, with `PORT=8080`, `APP_ENV=development`, `API_URL=http://localhost:8080`, `APP_URL` and `TRUSTED_ORIGINS` `http://localhost:3000`, `AUTH_COOKIE_PREFIX=soonlane-dev` and no `AUTH_COOKIE_DOMAIN` (localhost cookies reach every port), any `APP_COMMIT`, and an `API_PROXY_SECRET` equal to the web app's.

## Web app

`apps/web` builds one Bun server for the landing, the blog, the changelog, the legal pages and the app under `/app`. `bun run --cwd apps/web build` writes it to `apps/web/.output` with Nitro's `bun` preset: `server/index.mjs` and `public/` (Vite's assets, the files of `apps/web/public` and the prerendered pages). `bun run --cwd apps/web start` runs `bun .output/server/index.mjs`, which listens on `PORT` (3000 without it). It needs Bun 1.4; Bun 1.3 cannot parse the bundled router. The build ends with `apps/web/scripts/check-server.ts`: it starts the built server from a copy outside the repo, so nothing resolves from the workspace's `node_modules`, and fails the build unless robots answer per host and gzipped, a prerendered page is read from disk and comes gzipped with `no-cache`, an existing asset comes as its brotli copy and immutable, a missing one is a 404 with `no-store`, and `/health` answers.

What the server sends:

- `/assets/*`: `cache-control: public, max-age=31536000, immutable` when the file exists; a missing file answers 404 with `no-store`, so neither a client holding an old chunk name nor Cloudflare keeps the miss.
- Every other success, prerendered HTML included: `cache-control: no-cache`. Every error response: `no-store`.
- Compression: the files Nitro lists at build time are stored gzip and brotli next to the originals; the server gzips the other text responses (prerendered pages, server-rendered pages, robots, the feeds) for clients that accept gzip.
- `/health`: `{"ok":true,"environment":"<APP_ENV>","commit":"<short sha>"}`, without calling the API or the database.

| Variable                  | Read at | Production                 | Staging                            | Local                   |
| ------------------------- | ------- | -------------------------- | ---------------------------------- | ----------------------- |
| `APP_ENV`                 | build   | `production`               | `staging`                          | unset (`development`)   |
| `VITE_API_URL`            | build   | `https://api.soonlane.com` | `https://api.staging.soonlane.com` | `http://localhost:8080` |
| `VITE_AUTH_COOKIE_PREFIX` | build   | `soonlane`                 | `soonlane-staging`                 | `soonlane-dev`          |
| `VITE_POSTHOG_KEY`        | build   | optional, `phc_…`          | optional                           | optional                |
| `API_INTERNAL_URL`        | run     | `http://api.railway.internal:8080` | `http://api.railway.internal:8080` | `http://localhost:8080` |
| `API_PROXY_SECRET`        | run     | the `api` service's value  | the `api` service's value          | the local API's value   |
| `PORT`                    | run     | set by the service         | set by the service                 | 3000                    |

`APP_ENV` names the analytics `environment`, and a `production` build leaves drafts and future posts out of the blog ([blog.md](blog.md)). A `production` or `staging` build fails when `VITE_API_URL` or `VITE_AUTH_COOKIE_PREFIX` is missing, naming it: without them the pages call no API and look signed out. Development falls back to `soonlane-dev`, which matches no deployed environment. The `VITE_*` values are public and baked into the bundle, so a change needs a new build. The commit comes from `RAILWAY_GIT_COMMIT_SHA` on GitHub deploys, else from `APP_COMMIT` in `apps/web/commit.env`, which the staging workflow writes like the API's, else `dev`.

`.railway/railway.ts` sets these too. `API_PROXY_SECRET` is a reference to the `api` service's variable, so each environment's secret is entered once, on `api`; `VITE_POSTHOG_KEY` is `preserve()`, entered by hand.

`API_INTERNAL_URL` is where server rendering reaches the API, read per request, so the prerender needs neither it nor the secret; a missing one fails the first request that calls the API. It must be https, except on Railway's private network (a host ending in `.railway.internal`, plain http inside one environment) and in development. With `API_PROXY_SECRET` the API trusts the visitor IP the web server sends in `x-soonlane-visitor-ip`: Railway's `X-Real-IP`, or `CF-Connecting-IP` when that address is a Cloudflare edge (`resolveEdgeIp`, the rule the API applies to its own requests, see [Client IP](#client-ip)). The `/ingest` proxy sends PostHog the same address.

### Local environment

```sh
cp apps/web/.env.example apps/web/.env.local   # then fill it in
bun run db:migrate
bun run dev
```

`bun run dev` starts the web app on port 3000 and the API, which reads `apps/api/.env.local` ([Variables](#variables)); `API_PROXY_SECRET` must match in both files. `apps/web/.env.local` also holds `DATABASE_URL` and `DATABASE_URL_UNPOOLED` of the Neon `preview` branch for `bun run db:migrate` and `db:generate`. The files are git-ignored; never print them. Local sign-in uses the localhost redirect URI.

Signed-in screenshots without Google: `bun run --cwd apps/api dev:session` upserts "Sample User" (`sample@soonlane.test`) with a session in the development database and prints the session cookie; send that cookie to the dev server. `dev:session --delete` removes the user with its sessions and tasks; the script refuses `APP_ENV=production` and `NODE_ENV=production`, and it refuses to run unless `PRODUCTION_DATABASE_HOST` (the production Neon endpoint host) is set and absent from the database URLs.

### Google OAuth

Better Auth runs on the API with the API's origin as its base URL, so Google returns to the API host, which sets the session cookie on the environment's domain and redirects to the app. The OAuth client (type **Web application**) needs the redirect URIs `https://api.soonlane.com/api/auth/callback/google`, `https://api.staging.soonlane.com/api/auth/callback/google` and `http://localhost:8080/api/auth/callback/google`. The app sends absolute callback and error URLs on the page's own origin, which must be in the API's `TRUSTED_ORIGINS`; the API refuses relative ones, other hosts and its own.

## Migrations

The pre-deploy command `bun packages/db/scripts/migrate.ts` applies the Drizzle migrations from `packages/db/migrations` to `DATABASE_URL_UNPOOLED`, or `DATABASE_URL` without it. It runs in the built image after the build and before the new deployment takes traffic, where the private network is reachable. When it fails, the deployment fails and the previous one keeps serving; the pending migrations run in one transaction, so a failure leaves none of them applied. A change under `packages/db` deploys production, so a merged migration reaches it.

Staging's web server calls the staging API, so it uses staging's Postgres. Nothing migrates the Neon `preview` branch, which only local development uses; run `bun run db:migrate` after a new migration ([Local environment](#local-environment)).

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
# return addresses: a foreign host, a relative path, the API host or no body callbackURL is 400
curl -s -X POST -H 'Origin: https://staging.soonlane.com' -H 'content-type: application/json' -d '{"provider":"google","callbackURL":"/app"}' https://api.staging.soonlane.com/api/auth/sign-in/social
```

A deploy replaces the API before the web app, so for a few minutes a page loaded from the previous web build may call the new API: harmless while the cookie names and origins stay the same, but a change to either signs those tabs out until they reload. A cached preflight (2 hours in Chrome, up to a day in Firefox) can hide a CORS change; test in a fresh profile.

## Staging

Staging has no repository connected, so a push deploys nothing. To deploy a branch, tag or commit, run the **Deploy staging** workflow (Actions, or `gh workflow run deploy-staging.yml -f ref=<ref>`). It checks out the ref, writes its commit into `apps/api/commit.env` and `apps/web/commit.env`, and runs `railway up` with the `RAILWAY_TOKEN_STAGING` secret for `api`, then for `web`, waiting each time until the deployment passes its health check, so the web app never calls an API older than itself. Then:

```sh
curl https://api.staging.soonlane.com/health
# {"ok":true,"environment":"staging","commit":"<sha>"}
curl https://staging.soonlane.com/health
# {"ok":true,"environment":"staging","commit":"<short sha>"}
curl https://staging.soonlane.com/robots.txt
# User-agent: * and Disallow: /
```

## Production

Production builds `main` through Railway's GitHub connection with **Wait for CI**: Railway holds each push to `main` until the CI workflow on that commit has finished, skips the deploy if it failed, and deploys a service only when one of its watched paths changed. `api` watches `apps/api`, the `analytics`, `auth`, `contracts`, `db` and `domain` packages, `version.json`, `tooling/typescript-config`, the root `package.json`, `bun.lock` and `bunfig.toml`. `web` watches `apps/web`, the `analytics`, `auth`, `contracts`, `domain` and `ui` packages, `tooling/tailwind-config`, `tooling/typescript-config`, `version.json`, `CHANGELOG.md`, the root `package.json`, `bun.lock` and `bunfig.toml`. A change to one app alone deploys only that service; a shared package deploys both, each on its own, so for a few minutes either may be newer than the other. Nothing else deploys production; never run `railway up` against it.

## DNS

Records in Cloudflare (`soonlane.com` zone), with SSL mode Full (not Full (strict)) for the zone. The production hosts are proxied: Cloudflare flattens the apex CNAME, and its edge compresses and terminates TLS in front of Railway. The staging hosts stay DNS only, like `api.staging.soonlane.com`, which Cloudflare's universal certificate does not cover because it sits two levels deep. `www.soonlane.com` is not a Railway domain: a proxied record for `www` and a Cloudflare redirect rule send it to the apex, so no code handles it. Nothing depends on Railway's generated `*.up.railway.app` host: the deploy health check runs inside Railway and the staging workflow reads the deployment status.

| Host                       | Type  | Name                          | Value                                                                  | Proxy     |
| -------------------------- | ----- | ----------------------------- | ---------------------------------------------------------------------- | --------- |
| `api.soonlane.com`         | CNAME | `api`                         | `dw86xh7f.up.railway.app`                                              | Proxied   |
| `api.soonlane.com`         | TXT   | `_railway-verify.api`         | `railway-verify=…` (`railway domain status api.soonlane.com`)          | DNS only  |
| `api.staging.soonlane.com` | CNAME | `api.staging`                 | `8jedkcb7.up.railway.app`                                              | DNS only  |
| `api.staging.soonlane.com` | TXT   | `_railway-verify.api.staging` | `railway-verify=…` (`railway domain status api.staging.soonlane.com`)  | DNS only  |
| `soonlane.com`             | CNAME | `@`                           | the target `railway domain soonlane.com` prints                        | Proxied   |
| `soonlane.com`             | TXT   | `_railway-verify`             | `railway-verify=…` (`railway domain status soonlane.com`)              | DNS only  |
| `www.soonlane.com`         | CNAME | `www`                         | `soonlane.com`                                                         | Proxied   |
| `staging.soonlane.com`     | CNAME | `staging`                     | `xb4shabo.up.railway.app`                                              | DNS only  |
| `staging.soonlane.com`     | TXT   | `_railway-verify.staging`     | `railway-verify=…` (`railway domain status staging.soonlane.com`)      | DNS only  |

The `www` redirect rule (Rules, Redirect Rules): when the hostname equals `www.soonlane.com`, redirect to the dynamic URL `concat("https://soonlane.com", http.request.uri.path)` with status 301, preserving the query string.

## Cutover

Igor's steps, in order. Each one says how to check it. Variable and record values never go into the repository, a ticket or a chat.

1. **Staging secrets** on the `api` service in `staging`: `AUTH_SECRET`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `API_PROXY_SECRET`; optional `ALLOWED_EMAILS`, `POSTHOG_KEY`, and `VITE_POSTHOG_KEY` on `web`. Check: `railway variables --service api --environment staging --json | jq 'keys'` lists the names.
2. **Staging DNS**: the `staging` and `api.staging` CNAMEs and their `_railway-verify` TXT records from the table. Check: `railway domain status staging.soonlane.com` and `railway domain status api.staging.soonlane.com` report the domain verified and the certificate issued.
3. **Staging deploy**: run **Deploy staging** with the ref to test. Check: the curl commands under [Staging](#staging), then sign in on https://staging.soonlane.com and open `/app`.
4. **Production secrets** on the `api` service in `production`: `DATABASE_URL` (Neon `main`, direct), `AUTH_SECRET`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `API_PROXY_SECRET`; optional `ALLOWED_EMAILS`, `POSTHOG_KEY`, and `VITE_POSTHOG_KEY` on `web`. Check: the same `jq 'keys'` listing for `production`.
5. **Production domain for the site**: `railway domain soonlane.com --service web --environment production --port 8080`, which prints the CNAME target and the TXT value.
6. **The one apply**: `railway config apply --file .railway/railway.ts --environment production` after the PRs are on `main`. It sets the variables, the health checks and the GitHub source of `web`, and Railway then deploys `main`. Check: `railway config plan --environment production` reports the configuration up to date, and `railway deployment list --service web --environment production` and the same for `api` show a successful deployment.
7. **Railway's GitHub app** must have access to `Mnigos/soonlane`, or step 6 creates a source that never deploys. Check: the deployments in step 6.
8. **Production DNS**: the apex CNAME and its TXT, the `api` CNAME and its TXT from the table, the proxied `www` record and the redirect rule, SSL mode Full. Check:

```sh
curl https://soonlane.com/health
# {"ok":true,"environment":"production","commit":"<short sha>"}
curl -sI https://soonlane.com/ | grep -i -E '^HTTP|^server|x-vercel-id'
# 200, server: cloudflare, no x-vercel-id
curl -sI https://www.soonlane.com/blog | grep -i -E '^HTTP|^location'
# 301 to https://soonlane.com/blog
curl https://soonlane.com/robots.txt
# Allow: / and Sitemap: https://soonlane.com/sitemap.xml
curl https://api.soonlane.com/health
# {"ok":true,"environment":"production","commit":"<sha>"}
```

Then sign in on https://soonlane.com, open `/app`, add and complete a task, and check that the Mac app still loads.

**Going back**: point the apex and `www` records at Vercel again (the records Vercel's domain settings list, DNS only). Vercel still serves the build of `fcbd5f2`, and the Neon schema fits it as long as no migration has landed since; once one lands, this way back closes. Railway's services can keep running meanwhile.
