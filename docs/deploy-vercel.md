# Deploy on Vercel

The web app runs as the Vercel project `soonlane` (team `mnigos-projects`) connected to `Mnigos/soonlane`. Production is https://soonlane.com from branch `main`; staging is https://staging.soonlane.com from branch `staging`; every other branch gets a preview deployment. The server code runs on the API ([deploy-railway.md](deploy-railway.md)): the browser calls it directly with its cookies, and SSR calls it at `API_INTERNAL_URL`. The database is Neon (project `soonlane`, `eu-central-1`, database `soonlist`). The build configuration is in `apps/web/vercel.json`:

- `installCommand`: `bun install --frozen-lockfile`; Bun installs the whole workspace from `bun.lock` in the repository root, even when the command starts in `apps/web`;
- `buildCommand`: `bun run build`. The build never migrates: the API's Railway deploy migrates production ([deploy-railway.md](deploy-railway.md#migrations));
- `bunVersion: "1.4.x"`: functions run on Vercel's [Bun runtime](https://vercel.com/docs/functions/runtimes/bun) (beta), Bun 1.4 with patch versions managed by Vercel;
- `framework: null`: Vite builds the app under Bun (`bunx --bun vite build`), and Nitro (preset `vercel`) writes the result to `apps/web/.vercel/output` in the Build Output API v3 format: static files in `static/` and one function `functions/__server.func` with the `bun1.4.x` runtime, a `maxDuration` of 60 s and the region `fra1` (set in `apps/web/vite.config.ts`, next to the database). The runtime is pinned there because Nitro's default for `bunVersion` is `bun1.x`, which Vercel runs on Bun 1.3. Under Bun, Nitro also bundles with the `bun` export condition, so the build and the function must both run on Bun.
- After `vite build`, `apps/web/scripts/vercel-asset-routes.ts` rewrites the routes in `config.json`: a file under `/assets/` that exists gets `cache-control: public, max-age=31536000, immutable` (Vercel's `hit` phase), and one that does not answers 404 with `no-store` (a route right after the filesystem check, before the function fallback), so a chunk name from another deployment never stays cached as a 404 and never reaches the function. Nitro's preset sends the immutable header before the filesystem check, on misses too, and the script fails the build if Nitro stops writing that route.

Only the `staging` branch calls an API: the staging API, so it runs against staging's Railway Postgres, which the staging deploy migrates ([deploy-railway.md](deploy-railway.md#migrations)). Every other preview gets no API variables and serves the public pages only; sign-in and `/app` fail there. The Neon `preview` branch is left to local development, and nothing migrates it on deploy: after a new migration lands, run `bun run db:migrate` locally (it reads `apps/web/.env.local`, which points at `preview`).

## Project settings

- **Root Directory**: `apps/web`, with **Include files outside of the Root Directory in the Build Step** enabled (the build reads `packages/*` and `bun.lock` from the root).
- **Framework Preset**: Other. The install and build commands come from `vercel.json`; do not override them in the dashboard.
- **Node.js Version**: leave the default. Only Vercel's own build tooling runs on it; `bunVersion` selects the Bun runtime for the function, and the install and build commands call `bun`.
- Leave **Automatically expose System Environment Variables** enabled: `VERCEL_GIT_COMMIT_SHA` is the commit the analytics report and `VERCEL_ENV` names the analytics `environment`.

## Environment variables

| Variable                | Production                    | Preview (branch `staging`)        | Other previews | Development             |
| ----------------------- | ----------------------------- | --------------------------------- | -------------- | ----------------------- |
| `DATABASE_URL`, `DATABASE_URL_UNPOOLED` | unused | unused | unused | Neon `preview`, for `bun run db:migrate` |
| `API_INTERNAL_URL`      | `https://api.soonlane.com`    | `https://api.staging.soonlane.com` | unset          | `http://localhost:8080` |
| `API_PROXY_SECRET`      | production's API secret       | staging's API secret              | unset          | the local API's value   |
| `VITE_POSTHOG_KEY`      | optional, the PostHog project key (`phc_…`) | same               | same           | optional                |
| `VITE_API_URL`          | `https://api.soonlane.com`    | `https://api.staging.soonlane.com` | unset          | `http://localhost:8080` |
| `VITE_AUTH_COOKIE_PREFIX` | `soonlane`                  | `soonlane-staging`                | unset          | `soonlane-dev`          |

The deployed web app reads no database variable: the build does not migrate and the app never connects to the database, so `DATABASE_URL` and `DATABASE_URL_UNPOOLED` can be removed from the Vercel project. Locally `bun run db:migrate` still reads them from `apps/web/.env.local`.

`API_INTERNAL_URL` is where SSR reaches the API, read at runtime; it must be `https:` outside development. `API_PROXY_SECRET` is the same value as the API's in that environment: with it the API trusts the visitor IP the web server sends (`x-soonlane-visitor-ip`, from Vercel's `x-forwarded-for`), which Better Auth's rate limits count. A missing variable fails the first request that calls the API, not the build: the prerender calls no API. Both are Preview variables scoped to the branch `staging`, so other previews have neither.

`VITE_POSTHOG_KEY` is public: Vite puts it in the browser bundle at build time and the `/ingest` route reads the same build-time value, so a change needs a new deployment. Without it nothing goes to PostHog ([docs/analytics.md](analytics.md)).

`VITE_API_URL` is the API's public origin for the browser's oRPC and Better Auth clients, and `VITE_AUTH_COOKIE_PREFIX` the API's `AUTH_COOKIE_PREFIX` of the same environment; both are public and read at build time, so a change needs a new deployment. The prefix names the signed-in hint and the consent cookie the pages read, and SSR forwards only the visitor's session and consent cookies named with it. A build without it uses `soonlane-dev`, which matches no deployed environment, so a missing value shows as signed out rather than reading another environment's cookies. Without `VITE_API_URL` the browser has no API to call. So a Production build and the `staging` branch's build fail when either is unset, naming it; CI, local and other preview builds keep the fallback. Both are Preview variables scoped to the branch `staging`, like the API variables, so other previews call no API.

The sign-in variables (`AUTH_SECRET`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `ALLOWED_EMAILS`) and `APP_URL` belong to the API now and can be deleted from the Vercel project once the API serves production.

## Staging

The **Deploy staging** workflow deploys the API first and then force-pushes the same ref to the branch `staging`; Vercel builds that branch as a preview and serves it on https://staging.soonlane.com. Project settings for it:

- Domains: `staging.soonlane.com` assigned to the Git branch `staging`.
- Deployment Protection: off for `staging.soonlane.com` (Google's callback and calendar apps cannot pass it).
- Preview variables `API_INTERNAL_URL`, `API_PROXY_SECRET`, `VITE_API_URL` and `VITE_AUTH_COOKIE_PREFIX` scoped to the branch `staging`, as in the table.

## Google OAuth

Better Auth runs on the API with the API's origin as its base URL, so Google returns to the API host, which sets the session cookie on the environment's domain and redirects to the app. The OAuth client (type **Web application**) needs the redirect URIs `https://api.soonlane.com/api/auth/callback/google`, `https://api.staging.soonlane.com/api/auth/callback/google` and `http://localhost:8080/api/auth/callback/google`; the web-origin URIs from the forwarding stage can go. Other previews cannot sign in: they have no API variables, and no API trusts their origin.

The app sends absolute callback and error URLs on the page's own origin, which must be in the API's `TRUSTED_ORIGINS`; the API refuses relative ones, other hosts and its own.

## Local environment

```sh
bunx vercel@latest env pull apps/web/.env.local --environment=development --scope mnigos-projects --yes
bun run db:migrate
bun run dev
```

`bun run dev` starts the web app on port 3000 and the API (`apps/api`), which reads its variables from `apps/api/.env.local` ([deploy-railway.md](deploy-railway.md)); `API_PROXY_SECRET` must match in both files. The files are git-ignored. Never print them. Local sign-in uses the localhost redirect URI.

Signed-in screenshots without Google: `bun run --cwd apps/api dev:session` upserts "Sample User" (`sample@soonlane.test`) with a session in the development database and prints the session cookie; send that cookie to the dev server. `dev:session --delete` removes the user with its sessions and tasks; the script refuses production envs, and it refuses to run unless `PRODUCTION_DATABASE_HOST` (the production Neon endpoint host) is set and absent from the database URLs.

## Checks after a deployment

```sh
curl -s -X POST -H 'content-type: application/json' -d '{"json":null}' https://api.soonlane.com/api/rpc/system/health
# {"json":{"ok":true,"db":"ok","version":"<version>","commit":"<api commit>"}}
curl -s https://api.soonlane.com/api/auth/get-session
# null
```

Then open the URL, sign in with Google and check the avatar and name in the sidebar. A second Google account signs up and starts with an empty Upcoming; neither account sees the other's tasks. With `ALLOWED_EMAILS` set, a Google account that is not on the list and has no account yet ends on `/login` with "Sign-ups are closed on this server."

The public pages and the sitemap are static files; only soonlane.com may be crawled ([ADR 0008](decisions/0008-public-site-inside-the-web-app.md)):

```sh
curl -s https://soonlane.com/robots.txt
# User-agent: *, Allow: /, Disallow: /app, /api/, /login, /desktop/, Sitemap: https://soonlane.com/sitemap.xml
curl -s https://soonlane.com/sitemap.xml
# a <urlset> with https://soonlane.com/, /privacy and /terms
curl -sI https://soonlane.com/ | grep -i -E '^HTTP|x-vercel-id'
# 200 and an x-vercel-id with only the edge region (arn1::…): the prerendered HTML.
# A function response adds its region (arn1::fra1::…), as /login does.
```

Previews sit behind Vercel's deployment protection, so check them through the CLI, which signs the request:

```sh
bunx vercel@latest curl /robots.txt --deployment <preview-url> --scope mnigos-projects
# User-agent: * and Disallow: / (every host other than soonlane.com)
bunx vercel@latest curl /sitemap.xml --deployment <preview-url> --scope mnigos-projects
# the same three https://soonlane.com URLs
```

The Better Auth rate limiter on the API keeps its counters in the `rate_limit` table, keyed by the client IP the API settles (deploy-railway.md, Client IP). The 11th `POST /api/auth/sign-in/social` from one IP within a minute returns 429.

The `pg` driver logs a warning about `sslmode=require` being treated as `verify-full`; it is not an error.

## soonlane.com

soonlane.com uses Cloudflare DNS with DNS-only records pointing at Vercel. `www.soonlane.com` and `soonlist.vercel.app` redirect (308) to `soonlane.com`. The Google OAuth client still lists the `soonlist.vercel.app` origin and redirect URI; remove both once the checks above pass on https://soonlane.com and a production sign-in works.
