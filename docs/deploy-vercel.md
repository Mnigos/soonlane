# Deploy on Vercel

The app runs as the Vercel project `soonlane` (team `mnigos-projects`) connected to `Mnigos/soonlane`. Production is https://soonlane.com from branch `main`; every other branch gets a preview deployment. The database is Neon (project `soonlane`, `eu-central-1`, database `soonlist`). The build configuration is in `apps/web/vercel.json`:

- `installCommand`: `bun install --frozen-lockfile`; Bun installs the whole workspace from `bun.lock` in the repository root, even when the command starts in `apps/web`;
- `buildCommand`: `bun ../../packages/db/scripts/migrate.ts && bun run build`; Drizzle migrations run against `DATABASE_URL_UNPOOLED` (the direct Neon connection), or `DATABASE_URL` without it, of the environment being built. A failed migration stops the build and the previous deployment keeps running;
- `bunVersion: "1.4.x"`: functions run on Vercel's [Bun runtime](https://vercel.com/docs/functions/runtimes/bun) (beta), Bun 1.4 with patch versions managed by Vercel;
- `framework: null`: Vite builds the app under Bun (`bunx --bun vite build`), and Nitro (preset `vercel`) writes the result to `apps/web/.vercel/output` in the Build Output API v3 format: static files in `static/` and one function `functions/__server.func` with the `bun1.4.x` runtime, a `maxDuration` of 60 s and the region `fra1` (set in `apps/web/vite.config.ts`, next to the database). The runtime is pinned there because Nitro's default for `bunVersion` is `bun1.x`, which Vercel runs on Bun 1.3. Under Bun, Nitro also bundles with the `bun` export condition, so the build and the function must both run on Bun.
- After `vite build`, `apps/web/scripts/vercel-asset-routes.ts` rewrites the routes in `config.json`: a file under `/assets/` that exists gets `cache-control: public, max-age=31536000, immutable` (Vercel's `hit` phase), and one that does not answers 404 with `no-store` (a route right after the filesystem check, before the function fallback), so a chunk name from another deployment never stays cached as a 404 and never reaches the function. Nitro's preset sends the immutable header before the filesystem check, on misses too, and the script fails the build if Nitro stops writing that route.

Preview builds are not skipped: previews and local development use their own Neon branch, so their migrations never touch production.

## Project settings

- **Root Directory**: `apps/web`, with **Include files outside of the Root Directory in the Build Step** enabled (the build reads `packages/*` and `bun.lock` from the root).
- **Framework Preset**: Other. The install and build commands come from `vercel.json`; do not override them in the dashboard.
- **Node.js Version**: leave the default. Only Vercel's own build tooling runs on it; `bunVersion` selects the Bun runtime for the function, and the install and build commands call `bun`.
- Leave **Automatically expose System Environment Variables** enabled: `VERCEL_GIT_COMMIT_SHA` is the version `system.health` reports, `VERCEL_ENV` tells production from previews, turns on the OAuth proxy and names the analytics `environment`, and `VERCEL_URL` / `VERCEL_BRANCH_URL` give previews their base URL and every deployment its trusted origins.

## Environment variables

| Variable                | Production                    | Preview                     | Development             |
| ----------------------- | ----------------------------- | --------------------------- | ----------------------- |
| `DATABASE_URL`          | Neon `main`, pooled           | Neon `preview`, pooled      | Neon `preview`, pooled  |
| `DATABASE_URL_UNPOOLED` | Neon `main`, direct           | Neon `preview`, direct      | Neon `preview`, direct  |
| `APP_URL`               | `https://soonlane.com`        | `https://soonlane.com`      | `http://localhost:3000` |
| `AUTH_SECRET`           | random, at least 32 characters | random, at least 32 characters | random, at least 32 characters |
| `ALLOWED_EMAILS`        | unset                         | unset                       | unset                   |
| `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` | the OAuth client | same               | same                    |
| `OAUTH_PROXY_SECRET`    | optional, random              | same value as Production    | not needed              |
| `VITE_POSTHOG_KEY`      | optional, the PostHog project key (`phc_…`) | same        | optional                |

`VITE_POSTHOG_KEY` is public: Vite puts it in the browser bundle at build time and the server reads the same variable at runtime, so a change needs a new deployment. Without it nothing goes to PostHog ([docs/analytics.md](analytics.md)).

`ALLOWED_EMAILS` is optional: a comma-separated list of addresses (case-insensitive) that may create an account. Leave it unset so anyone can sign up. Set it only to close sign-ups, for example while abuse is going on or on a self-hosted copy; existing accounts keep signing in. To open sign-ups again, delete the variable in the Vercel project settings and redeploy.

`APP_URL` is production's URL in Production and Preview, and the dev server's in Development. It is the only place that names the production URL:

- Production serves `APP_URL` as its base URL.
- A preview serves its own host: the base URL is `https://$VERCEL_BRANCH_URL`, then `https://$VERCEL_URL`. It reads `APP_URL` only as the OAuth proxy target (below), so it needs production's URL there, never its own.
- A local run serves `APP_URL`, or `http://localhost:3000` when it is unset.

A Vercel deployment without `APP_URL` fails to load its configuration instead of guessing. Better Auth and `/api/rpc` accept requests from the base URL and from both Vercel hosts of the deployment; a preview does not trust production's origin.

## Google OAuth and previews

The OAuth client (type **Web application**) has:

- Authorized JavaScript origins: `https://soonlane.com`, `http://localhost:3000`
- Authorized redirect URIs: `https://soonlane.com/api/auth/callback/google`, `http://localhost:3000/api/auth/callback/google`

The `soonlist.vercel.app` origin and redirect URI stay in the client until step 6 of the move below.

Preview URLs change per branch, so they cannot be registered. Better Auth's `oAuthProxy` plugin runs on every Vercel deployment (`VERCEL_ENV` `production` or `preview`, never locally) with `APP_URL` as the production URL:

1. "Continue with Google" on a preview sends Google the production redirect URI (`$APP_URL/api/auth/callback/google`) and an encrypted state.
2. Production receives the callback, exchanges the code with Google and redirects to `<preview>/api/auth/callback/google/oauth-proxy` with the encrypted profile (valid for 60 s).
3. The preview decrypts it, applies the sign-up check, creates the user and session in its own database and redirects to `/app`.

Requirements:

- Production must run a build that contains the plugin; until then preview sign-in fails at the production callback.
- `APP_URL` in Preview must be production's URL. A preview's own URL there makes it skip the proxy and send Google an unregistered redirect URI.
- Production and Preview must share the encryption secret: set the same `OAUTH_PROXY_SECRET` in both, or keep the same `AUTH_SECRET` in both. A dedicated `OAUTH_PROXY_SECRET` is preferred, so preview and production session secrets can differ.
- The consent screen asks only for `openid`, `email` and `profile`, so in Testing mode any Google account can sign in without being on the test-user list.

The app sends Google absolute callback and error URLs on the page's own origin: on a Google error (for example a cancel), production's callback redirects to the error URL as given, so a relative URL would land on production instead of the preview.

## Local environment

```sh
bunx vercel@latest env pull apps/web/.env.local --environment=development --scope mnigos-projects --yes
bun run db:migrate
bun run dev
```

The file is git-ignored. Never print it. Local sign-in uses the localhost redirect URI directly.

Signed-in screenshots without Google: `bun run --cwd apps/web dev:session` upserts "Sample User" (`sample@soonlane.test`) with a session in the development database and prints the session cookie; send that cookie to the dev server. `dev:session --delete` removes the user with its sessions and tasks; the script refuses production envs, and it refuses to run unless `PRODUCTION_DATABASE_HOST` (the production Neon endpoint host, set in Vercel's development environment) is set and absent from the database URLs.

## Checks after a deployment

```sh
curl -s -X POST -H 'content-type: application/json' -d '{"json":null}' https://soonlane.com/api/rpc/system/health
# {"json":{"ok":true,"db":"ok","version":"<commit sha>"}}
curl -s https://soonlane.com/api/auth/get-session
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

The Better Auth rate limiter keeps its counters in the `rate_limit` table. The 11th `POST /api/auth/sign-in/social` from one IP within a minute returns 429.

The `pg` driver logs a warning about `sslmode=require` being treated as `verify-full`; it is not an error.

## Moving to soonlane.com

soonlane.com uses Cloudflare DNS with DNS-only records pointing at Vercel. Steps 1 to 5 are done; step 6 remains.

1. Done: `soonlane.com` and `www.soonlane.com` are on the Vercel project, and `www.soonlane.com` redirects (308) to `soonlane.com`. `soonlist.vercel.app` stays assigned to production until step 5, so the old URL still serves the app.
2. Done: the Google OAuth client has the origin `https://soonlane.com` and the redirect URI `https://soonlane.com/api/auth/callback/google`. The `soonlist.vercel.app` entries stay until step 6.
3. Done: production's base URL is `https://soonlane.com`.
4. Done: the `oAuthProxy` production URL and the desktop app's URL are `https://soonlane.com`, and this file and `README.md` use the new URL. Both come from `APP_URL` (above).
5. Done: `soonlist.vercel.app` redirects (308) to `soonlane.com`. Production trusts the `APP_URL` origin and its own deployment hosts (`VERCEL_URL`, `VERCEL_BRANCH_URL`), not `soonlist.vercel.app`, so requests that stay there would fail the origin check. Sessions are per host, so the owner signs in once more on soonlane.com, and the desktop app needs a build from step 4.
6. Run the checks above against https://soonlane.com, sign in with Google on production and on a preview built after the merge (older previews still send Google the `soonlist.vercel.app` redirect URI), and check that both `www.soonlane.com` and `soonlist.vercel.app` redirect to the apex. Then remove the `soonlist.vercel.app` origin and redirect URI from the Google client.
