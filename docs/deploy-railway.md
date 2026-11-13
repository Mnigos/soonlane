# Deploy on Railway

Soonlane runs as two services in the Railway project `Soonlane`, each with one replica in Amsterdam (`europe-west4-drams3a`), in two environments ([ADR 0013](decisions/0013-three-hosts-on-railway.md)). `api` (`apps/api`) serves Better Auth (`/api/auth/*`), the oRPC API (`/api/rpc/*`) and the calendar feed (`/calendar/*`) at https://api.soonlane.com and https://api.staging.soonlane.com. `web` (`apps/web`) is one Bun server for the landing, the blog, the changelog and the legal pages at https://soonlane.com and https://staging.soonlane.com, and for the app at https://app.soonlane.com and https://app.staging.soonlane.com, telling the hosts apart by the request's host; its pages call the API from the browser with credentials and from server rendering over the private network with the proxy secret ([Web app](#web-app)). Staging has its own Railway Postgres (the `Postgres` service, same region, volume `postgres-volume`), reached at `postgres.railway.internal`; production uses Neon until its data moves to Railway.

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
| `APP_URL`              | `https://app.soonlane.com` | `https://app.staging.soonlane.com` |
| `TRUSTED_ORIGINS` | `https://app.soonlane.com` | `https://app.staging.soonlane.com` |
| `AUTH_COOKIE_PREFIX` | `soonlane`              | `soonlane-staging`                 |
| `AUTH_COOKIE_DOMAIN` | `soonlane.com`          | `staging.soonlane.com`             |
| `DATABASE_URL`    | `${{Postgres.DATABASE_URL}}`, entered by hand | `${{Postgres.DATABASE_URL}}` |
| `AUTH_SECRET`          | secret, at least 32 characters | its own secret                 |
| `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` | the OAuth client | the same client           |
| `API_PROXY_SECRET`     | secret, the web server's too | its own secret, the web server's too |
| `ALLOWED_EMAILS`       | optional                   | optional                           |
| `POSTHOG_KEY`          | optional, the PostHog project key | optional                    |
| `TODOIST_CLIENT_ID`, `TODOIST_CLIENT_SECRET` | optional, both or neither: the Todoist app for Import from Todoist | the same app |

`.railway/railway.ts` sets the plain values and marks the secrets `preserve()`, so an apply keeps what was entered by hand. `TRUSTED_ORIGINS` is a comma-separated list of exact origins that may call `/api/auth` and `/api/rpc` from the browser (CORS with credentials) and that sign-in may return to; any other `Origin` gets 403. `API_URL` is the API's public origin: Better Auth's base URL (Google returns to `<API_URL>/api/auth/callback/google`) and the host of calendar links. `APP_URL` is the app's origin: Better Auth sends its errors to `<APP_URL>/login`, and the feed's events link to `<APP_URL>/`. Only the app's origin is trusted; the public site never calls the API. `AUTH_COOKIE_PREFIX` names every cookie and must equal the web build's `VITE_AUTH_COOKIE_PREFIX`; `AUTH_COOKIE_DOMAIN` is the domain the cookies cover, so the web app's host receives them. Production's cookies cover `soonlane.com`, so the browser sends them to the staging hosts too: the staging API receives a production session token on every browser call from someone signed in to production. Staging's Better Auth ignores them, because its prefix and its `AUTH_SECRET` differ, and its web server forwards only `soonlane-staging.*` cookies, but only during server rendering; nothing filters the browser's direct calls. Code deployed to staging could copy that token, so staging runs only trusted refs, and the API never logs the cookie header. The commit comes from `RAILWAY_GIT_COMMIT_SHA` on GitHub deploys. `railway up` uploads no git metadata, so the staging workflow writes `APP_COMMIT=<sha>` to `apps/api/commit.env` (gitignored, kept in the upload by `.railwayignore`) and the build inlines it into the bundle, ignoring any `APP_COMMIT` variable, so the commit always belongs to the uploaded code. The API refuses to start when a variable is missing or malformed and names it in the log.

Locally the API reads `apps/api/.env.local` (Bun loads it from the working directory): the same names, with `PORT=4000`, `APP_ENV=development`, `API_URL=http://localhost:4000`, `APP_URL` and `TRUSTED_ORIGINS` `http://localhost:3000`, `SITE_URL=http://localhost:3001`, `AUTH_COOKIE_PREFIX=soonlane-dev` and no `AUTH_COOKIE_DOMAIN` (localhost cookies reach every port), any `APP_COMMIT`, and an `API_PROXY_SECRET` equal to the web app's.

## Web app

`apps/web` builds one Bun server for the public site and the app. The host of `VITE_APP_URL` gets the app at its own paths (Upcoming at `/`, `/today`, `/labels/<name>`, `/login`); every other host gets the public pages, and each answers 404 for the other's pages. `/health`, `/ingest` and `/robots.txt` answer on both. `bun run --cwd apps/web build` writes it to `apps/web/.output` with Nitro's `bun` preset: `server/index.mjs` and `public/` (Vite's assets, the files of `apps/web/public` and the prerendered pages). `bun run --cwd apps/web start` runs `bun .output/server/index.mjs`, which listens on `PORT` (3000 without it). It needs Bun 1.4; Bun 1.3 cannot parse the bundled router. The build ends with `apps/web/scripts/check-server.ts`: it starts the built server from a copy outside the repo, so nothing resolves from the workspace's `node_modules`, and fails the build unless robots answer per host and gzipped, a prerendered page is read from disk on the site host and comes gzipped with `no-cache`, the app host renders `/` instead, the site host answers 404 for `/today` and `/login` and the app host for `/privacy`, an existing asset comes as its brotli copy and immutable, a missing one is a 404 with `no-store`, and `/health` answers on both hosts.

What the server sends:

- `/assets/*`: `cache-control: public, max-age=31536000, immutable` when the file exists; a missing file answers 404 with `no-store`, so neither a client holding an old chunk name nor Cloudflare keeps the miss.
- Every other success, prerendered HTML included: `cache-control: no-cache`. Every error response: `no-store`.
- Compression: the files Nitro lists at build time are stored gzip and brotli next to the originals; the server gzips the other text responses (prerendered pages, server-rendered pages, robots, the feeds) for clients that accept gzip.
- `/health`: `{"ok":true,"environment":"<APP_ENV>","commit":"<short sha>"}`, without calling the API or the database.

| Variable                  | Read at | Production                 | Staging                            | Local                   |
| ------------------------- | ------- | -------------------------- | ---------------------------------- | ----------------------- |
| `APP_ENV`                 | build   | `production`               | `staging`                          | unset (`development`)   |
| `VITE_API_URL`            | build   | `https://api.soonlane.com` | `https://api.staging.soonlane.com` | `http://localhost:4000` |
| `VITE_AUTH_COOKIE_PREFIX` | build   | `soonlane`                 | `soonlane-staging`                 | `soonlane-dev`          |
| `VITE_APP_URL`            | build   | `https://app.soonlane.com` | `https://app.staging.soonlane.com` | unset (`http://localhost:3000`) |
| `VITE_SITE_URL`           | build   | `https://soonlane.com`     | `https://staging.soonlane.com`     | unset (`http://127.0.0.1:3000`) |
| `VITE_POSTHOG_KEY`        | build   | optional, `phc_…`          | optional                           | optional                |
| `API_INTERNAL_URL`        | run     | `http://api.railway.internal:8080` | `http://api.railway.internal:8080` | `http://localhost:4000` |
| `API_PROXY_SECRET`        | run     | the `api` service's value  | the `api` service's value          | the local API's value   |
| `PORT`                    | run     | set by the service         | set by the service                 | 3000                    |

`APP_ENV` names the analytics `environment`, and a `production` build leaves drafts and future posts out of the blog ([blog.md](blog.md)). A `production` or `staging` build fails when `VITE_API_URL`, `VITE_AUTH_COOKIE_PREFIX`, `VITE_APP_URL` or `VITE_SITE_URL` is missing, naming it: without the first two the pages call no API and look signed out, without the origins the server cannot tell the app's host from the site's. Development falls back to `soonlane-dev`, the app on `http://localhost:3000` (the origin the local API trusts) and the site on `http://127.0.0.1:3000`. `VITE_SITE_URL` is where app pages link to the public pages; canonical links and the sitemap keep the fixed `SITE_URL`. The `VITE_*` values are public and baked into the bundle, so a change needs a new build. The commit comes from `RAILWAY_GIT_COMMIT_SHA` on GitHub deploys, else from `APP_COMMIT` in `apps/web/commit.env`, which the staging workflow writes like the API's, else `dev`.

`.railway/railway.ts` sets these too. `API_PROXY_SECRET` is a reference to the `api` service's variable, so each environment's secret is entered once, on `api`; `VITE_POSTHOG_KEY` is `preserve()`, entered by hand.

`API_INTERNAL_URL` is where server rendering reaches the API, read per request, so the prerender needs neither it nor the secret; a missing one fails the first request that calls the API. It must be https, except on Railway's private network (a host ending in `.railway.internal`, plain http inside one environment) and in development. With `API_PROXY_SECRET` the API trusts the visitor IP the web server sends in `x-soonlane-visitor-ip`: Railway's `X-Real-IP`, or `CF-Connecting-IP` when that address is a Cloudflare edge (`resolveEdgeIp`, the rule the API applies to its own requests, see [Client IP](#client-ip)). The `/ingest` proxy sends PostHog the same address.

### Local environment

```sh
cp apps/api/.env.example apps/api/.env.local   # then fill in the secrets
cp apps/web/.env.example apps/web/.env.local
bun run db:up
bun run db:migrate
bun run dev
```

`bun run dev` starts the web app on port 3000 and the API, which reads `apps/api/.env.local` ([Variables](#variables)); `API_PROXY_SECRET` must match in both files. `bun run db:up` starts Postgres 18 from `compose.yaml` in Docker, on `localhost:5433` with its data in the `postgres-data` volume; `docker compose down` stops it and keeps the data, `docker compose down -v` deletes it. Its URL belongs in `apps/api/.env.local` only (`DATABASE_URL`, already in the example), read by the API and by `bun run db:migrate` and `db:generate`. The web app needs no database variable. The files are git-ignored; never print them. Local sign-in uses the localhost redirect URI. With the Todoist pair set, Todoist returns to `http://localhost:4000/api/auth/callback/todoist`, which the Todoist app lists next to the production and staging callbacks.

Signed-in screenshots without Google: `bun run --cwd apps/api dev:session` upserts "Sample User" (`sample@soonlane.test`) with a session in the development database and prints the session cookie; send that cookie to the dev server. `dev:session --delete` removes the user with its sessions and tasks; the script refuses `APP_ENV=production` and `NODE_ENV=production`, and it refuses any database that is not on `localhost`, `127.0.0.1` or `::1`.

### Google OAuth

Better Auth runs on the API with the API's origin as its base URL, so Google returns to the API host, which sets the session cookie on the environment's domain and redirects to the app. The OAuth client (type **Web application**) needs the redirect URIs `https://api.soonlane.com/api/auth/callback/google`, `https://api.staging.soonlane.com/api/auth/callback/google` and `http://localhost:4000/api/auth/callback/google`. The app sends absolute callback and error URLs on the page's own origin, which must be in the API's `TRUSTED_ORIGINS`; the API refuses relative ones, other hosts and its own.

## Migrations

The pre-deploy command `bun packages/db/scripts/migrate.ts` applies the Drizzle migrations from `packages/db/migrations` to `DATABASE_URL_UNPOOLED`, or `DATABASE_URL` without it. It runs in the built image after the build and before the new deployment takes traffic, where the private network is reachable. When it fails, the deployment fails and the previous one keeps serving; the pending migrations run in one transaction, so a failure leaves none of them applied. A change under `packages/db` deploys production, so a merged migration reaches it.

Staging's web server calls the staging API, so it uses staging's Postgres. Nothing migrates the local database; run `bun run db:migrate` after a new migration ([Local environment](#local-environment)).

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
curl -si -X OPTIONS -H 'Origin: https://app.staging.soonlane.com' -H 'Access-Control-Request-Method: POST' https://api.staging.soonlane.com/api/rpc/identity/me
# another subdomain, the public site, production's origin or the API's own: 403 for the preflight and the request
curl -s -o /dev/null -w '%{http_code}\n' -X POST -H 'Origin: https://evil.staging.soonlane.com' -H 'content-type: application/json' -d '{"json":null}' https://api.staging.soonlane.com/api/rpc/identity/me
# return addresses: a foreign host, a relative path, the API host or no body callbackURL is 400
curl -s -X POST -H 'Origin: https://app.staging.soonlane.com' -H 'content-type: application/json' -d '{"provider":"google","callbackURL":"/"}' https://api.staging.soonlane.com/api/auth/sign-in/social
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
curl -s -o /dev/null -w '%{http_code}\n' https://staging.soonlane.com/today
# 404: the app is on app.staging.soonlane.com
curl https://app.staging.soonlane.com/health
# the same answer as staging.soonlane.com
```

## Production

Production builds `main` through Railway's GitHub connection with **Wait for CI**: Railway holds each push to `main` until the CI workflow on that commit has finished, skips the deploy if it failed, and deploys a service only when one of its watched paths changed. `api` watches `apps/api`, the `analytics`, `auth`, `contracts`, `db` and `domain` packages, `version.json`, `tooling/typescript-config`, the root `package.json`, `bun.lock` and `bunfig.toml`. `web` watches `apps/web`, the `analytics`, `auth`, `contracts`, `domain` and `ui` packages, `tooling/tailwind-config`, `tooling/typescript-config`, `version.json`, `CHANGELOG.md`, the root `package.json`, `bun.lock` and `bunfig.toml`. A change to one app alone deploys only that service; a shared package deploys both, each on its own, so for a few minutes either may be newer than the other. Nothing else deploys production; never run `railway up` against it.

Railway judges each push on its own: it waits for that commit's CI, skips the commit when CI was cancelled and no other workflow on it passed (on a push to `main` only CI runs), and matches the watched paths against that commit's changes, not against the commit the service runs. A push skipped for its CI is therefore never deployed by a later push that touches none of the service's paths. CI on `main` runs each push in its own concurrency group, so a later merge never cancels an earlier one's run; pull request runs still cancel their older runs.

To see whether a service is behind `main`, compare the commit `/health` reports with the commits since then that touch its watched paths, and read the skip reason of each push:

```sh
git fetch origin main
curl -s https://soonlane.com/health          # web: "commit":"<short sha>"
curl -s https://api.soonlane.com/health      # api: "commit":"<sha>"
git log --oneline <commit from /health>..origin/main -- <watched paths of the service>
railway deployment list --service web --environment production --json \
  | jq -r '.[] | [.createdAt, .status, .meta.commitHash[0:7], (.meta.skippedReason // "")] | @tsv'
```

A service is behind when that `git log` lists a commit. "No changes to watched files" is expected; "CI check suite failed" on a commit that touched the service's paths means that push was not deployed, and its change is missing as long as the `git log` lists it. Deploy the commit at the tip of `main` by hand, then check `/health` again:

```sh
railway redeploy --service web --environment production --commit <sha> --yes
```

`--commit` builds that commit of the connected repository once without pinning it, and the next push to `main` deploys as usual; `--from-source` deploys the latest commit of the connected branch. Without either flag, `redeploy` reruns the current build.

## DNS

Records in Cloudflare (`soonlane.com` zone), with SSL mode Full (strict) for the zone, which Railway's certificates satisfy. The production hosts are proxied: Cloudflare flattens the apex CNAME, and its edge compresses and terminates TLS in front of Railway. The staging hosts stay DNS only, like `api.staging.soonlane.com`, which Cloudflare's universal certificate does not cover because it sits two levels deep. `www.soonlane.com` is not a Railway domain: a proxied record for `www` and a Cloudflare redirect rule send it to the apex, so no code handles it. Nothing depends on Railway's generated `*.up.railway.app` host: the deploy health check runs inside Railway and the staging workflow reads the deployment status.

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
| `app.soonlane.com`         | CNAME | `app`                         | the target `railway domain app.soonlane.com` prints                    | Proxied   |
| `app.soonlane.com`         | TXT   | `_railway-verify.app`         | `railway-verify=…` (`railway domain status app.soonlane.com`)          | DNS only  |
| `app.staging.soonlane.com` | CNAME | `app.staging`                 | the target `railway domain app.staging.soonlane.com` prints            | DNS only  |
| `app.staging.soonlane.com` | TXT   | `_railway-verify.app.staging` | `railway-verify=…` (`railway domain status app.staging.soonlane.com`)  | DNS only  |

The `www` redirect rule (Rules, Redirect Rules): when the hostname equals `www.soonlane.com`, redirect to the dynamic URL `concat("https://soonlane.com", http.request.uri.path)` with status 301, preserving the query string.

## Cutover

Igor's steps, in order. Each one says how to check it. Variable and record values never go into the repository, a ticket or a chat.

1. **Staging secrets** on the `api` service in `staging`: `AUTH_SECRET`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `API_PROXY_SECRET`; optional `ALLOWED_EMAILS`, `POSTHOG_KEY`, and `VITE_POSTHOG_KEY` on `web`. Check: `railway variables --service api --environment staging --json | jq 'keys'` lists the names.
2. **Staging DNS**: the `staging` and `api.staging` CNAMEs and their `_railway-verify` TXT records from the table. Check: `railway domain status staging.soonlane.com` and `railway domain status api.staging.soonlane.com` report the domain verified and the certificate issued.
3. **Staging deploy**: run **Deploy staging** with the ref to test. Check: the curl commands under [Staging](#staging), then sign in on https://app.staging.soonlane.com.
4. **Production secrets** on the `api` service in `production`: `DATABASE_URL` (Neon `main`, direct), `AUTH_SECRET`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `API_PROXY_SECRET`; optional `ALLOWED_EMAILS`, `POSTHOG_KEY`, and `VITE_POSTHOG_KEY` on `web`. Check: the same `jq 'keys'` listing for `production`.
5. **The `web` service and the site's domain**: `web` does not exist in production before this step, and a domain needs its service. Apply a copy of `.railway/railway.ts` without the production `web` custom domain (`railway config apply --file <copy> --environment production`), which creates `web` with its variables, health check and GitHub source, and Railway deploys `main` to it. Then `railway domain soonlane.com --service web --environment production --port 8080`, which prints the CNAME target and the TXT value.
6. **The final apply**: `railway config apply --file .railway/railway.ts --environment production` with the unmodified file from `main`, after the PRs are on `main`; the domain exists by now, so it changes nothing. Check: `railway config plan --file .railway/railway.ts --environment production` reports nothing to change, and `railway deployment list --service web --environment production` and the same for `api` show a successful deployment.
7. **Railway's GitHub app** must have access to `Mnigos/soonlane`, or step 5 creates a source that never deploys. Check: the deployments in step 6.
8. **Production DNS**: the apex CNAME and its TXT, the `api` CNAME and its TXT from the table, the proxied `www` record and the redirect rule, SSL mode Full (strict). Until Railway has verified a custom domain, its edge answers "Application not found" for that host, so these checks pass only once DNS points at Railway. Check:

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

Then sign in on https://app.soonlane.com, add and complete a task, and check that the Mac app still loads.

**Going back**: production runs on Railway behind Cloudflare's proxy (the apex and `www` CNAMEs proxied, the `www` redirect rule to the apex). To go back, replace the apex CNAME with the record Vercel's domain settings list, DNS only; the proxied `www` record and its redirect rule keep sending `www` to the apex. Vercel still serves the build of `fcbd5f2`, and the Neon schema fits it as long as no migration has landed since; once one lands, this way back closes. Railway's services can keep running meanwhile.

## The app host

The app moved from `soonlane.com/app` to `app.soonlane.com` ([ADR 0013](decisions/0013-three-hosts-on-railway.md), update of 2026-11-13). The `web` service has two custom domains per environment, the most Railway's Hobby plan allows. Igor's steps, in order:

1. **Staging domain**: `railway domain app.staging.soonlane.com --service web --environment staging --port 8080`, then its CNAME and TXT records from the [DNS](#dns) table. Check: `railway domain status app.staging.soonlane.com` reports it verified with a certificate.
2. **Staging config and deploy**: `railway config apply --file .railway/railway.ts --environment staging` from the branch, then **Deploy staging** with the branch. Check: the curl commands under [Staging](#staging), sign in on https://app.staging.soonlane.com, and "Open app" on https://staging.soonlane.com leads there.
3. **Production domain**: `railway domain app.soonlane.com --service web --environment production --port 8080`, then its proxied CNAME and its TXT. Check: `railway domain status app.soonlane.com`. Until the merge it serves the current build.
4. **The Mac app**: the release that loads `https://app.soonlane.com` ([SOON-125](https://linear.app/rigtch/issue/SOON-125)) ships with the switch; installed builds for `https://soonlane.com` show a 404 from then on.
5. **Before the merge, by hand**: give production's `web` the new origins without a deploy (the running build ignores them), let `api` trust both origins, today's and the new one, and point `api`'s `APP_URL` (Better Auth's error page and the calendar events' link) at the app host, whose domain already serves the current build. Check: once `api` has redeployed, the preflight under [CORS](#cors-and-return-addresses), pointed at `api.soonlane.com`, answers 204 for both `https://soonlane.com` and `https://app.soonlane.com`, and the app at `soonlane.com/app` still works.

   ```sh
   railway variable set VITE_APP_URL=https://app.soonlane.com VITE_SITE_URL=https://soonlane.com --service web --environment production --skip-deploys
   railway variable set TRUSTED_ORIGINS=https://soonlane.com,https://app.soonlane.com APP_URL=https://app.soonlane.com --service api --environment production
   ```

6. **Merge**: Railway builds `web` from `main` with its variables in place, and `api` too. The old `web` serves until the new one is live, and both origins are trusted all along. Check: signing in on https://app.soonlane.com works without signing in again, and:

   ```sh
   curl -s -o /dev/null -w '%{http_code}\n' https://soonlane.com/app
   # 404
   curl -sI https://app.soonlane.com/ | grep -i -E '^HTTP|^location'
   # 307 to /login when signed out
   curl https://app.soonlane.com/robots.txt
   # User-agent: * and Disallow: /
   ```

7. **Apply**: once the new `web` deployment is live, run `railway config apply --file .railway/railway.ts --environment production` from `main`. It drops `soonlane.com` from `TRUSTED_ORIGINS`; `web` and `APP_URL` already have their values. Check: `railway config plan --file .railway/railway.ts --environment production` reports nothing to change, the preflight answers 204 for `https://app.soonlane.com` and 403 for `https://soonlane.com`, and sign-in on the app still works.
8. **PostHog**: add `https://app.soonlane.com` and `https://app.staging.soonlane.com` to the project's authorized URLs. Google's and Todoist's redirect URIs are on the API host and do not change.

No step leaves the app without a trusted origin: the old app's origin stays trusted until the new app is live. Staging takes the shorter order of steps 1 and 2: between the apply and the end of **Deploy staging**, the old staging build cannot call the API, which only affects testers.
