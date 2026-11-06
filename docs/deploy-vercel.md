# Deploy on Vercel

The app runs as the Vercel project `soonlane` (team `mnigos-projects`) connected to `Mnigos/soonlane`. Production is https://soonlist.vercel.app from branch `main` until the move to soonlane.com (below); every other branch gets a preview deployment. The database is Neon (project `soonlane`, `eu-central-1`, database `soonlist`). The build configuration is in `apps/web/vercel.json`:

- `installCommand`: `bun install --frozen-lockfile`; Bun installs the whole workspace from `bun.lock` in the repository root, even when the command starts in `apps/web`;
- `buildCommand`: `bun ../../packages/db/scripts/migrate.ts && bun run build`; Drizzle migrations run against `DATABASE_URL_UNPOOLED` (the direct Neon connection), or `DATABASE_URL` without it, of the environment being built. A failed migration stops the build and the previous deployment keeps running;
- `bunVersion: "1.4.x"`: functions run on Vercel's [Bun runtime](https://vercel.com/docs/functions/runtimes/bun) (beta), Bun 1.4 with patch versions managed by Vercel;
- `framework: null`: Vite builds the app under Bun (`bunx --bun vite build`), and Nitro (preset `vercel`) writes the result to `apps/web/.vercel/output` in the Build Output API v3 format: static files in `static/` and one function `functions/__server.func` with the `bun1.4.x` runtime, a `maxDuration` of 60 s and the region `fra1` (set in `apps/web/vite.config.ts`, next to the database). The runtime is pinned there because Nitro's default for `bunVersion` is `bun1.x`, which Vercel runs on Bun 1.3. Under Bun, Nitro also bundles with the `bun` export condition, so the build and the function must both run on Bun.

Preview builds are not skipped: previews and local development use their own Neon branch, so their migrations never touch production.

## Project settings

- **Root Directory**: `apps/web`, with **Include files outside of the Root Directory in the Build Step** enabled (the build reads `packages/*` and `bun.lock` from the root).
- **Framework Preset**: Other. The install and build commands come from `vercel.json`; do not override them in the dashboard.
- **Node.js Version**: leave the default. Only Vercel's own build tooling runs on it; `bunVersion` selects the Bun runtime for the function, and the install and build commands call `bun`.
- Leave **Automatically expose System Environment Variables** enabled: `VERCEL_GIT_COMMIT_SHA` is the version `system.health` reports, `VERCEL_ENV` turns on the OAuth proxy, and `VERCEL_URL` / `VERCEL_BRANCH_URL` give previews their base URL and trusted origins.

## Environment variables

| Variable                | Production                    | Preview                     | Development             |
| ----------------------- | ----------------------------- | --------------------------- | ----------------------- |
| `DATABASE_URL`          | Neon `main`, pooled           | Neon `preview`, pooled      | Neon `preview`, pooled  |
| `DATABASE_URL_UNPOOLED` | Neon `main`, direct           | Neon `preview`, direct      | Neon `preview`, direct  |
| `AUTH_URL`              | `https://soonlist.vercel.app` | unset (derived, see below)  | `http://localhost:3000` |
| `AUTH_SECRET`           | random, at least 32 characters | random, at least 32 characters | random, at least 32 characters |
| `OWNER_EMAIL`           | the owner's Google address    | same                        | same                    |
| `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` | the OAuth client | same               | same                    |
| `OAUTH_PROXY_SECRET`    | optional, random              | same value as Production    | not needed              |

Without `AUTH_URL` the base URL is `https://$VERCEL_BRANCH_URL`, then `https://$VERCEL_URL`. Better Auth and `/api/rpc` accept requests from the base URL and from both Vercel hosts of the deployment.

## Google OAuth and previews

The OAuth client (type **Web application**) has:

- Authorized JavaScript origins: `https://soonlist.vercel.app`, `http://localhost:3000`
- Authorized redirect URIs: `https://soonlist.vercel.app/api/auth/callback/google`, `http://localhost:3000/api/auth/callback/google`

Preview URLs change per branch, so they cannot be registered. Better Auth's `oAuthProxy` plugin runs on every Vercel deployment (`VERCEL_ENV` `production` or `preview`, never locally):

1. "Continue with Google" on a preview sends Google the production redirect URI and an encrypted state.
2. Production receives the callback, exchanges the code with Google and redirects to `<preview>/api/auth/callback/google/oauth-proxy` with the encrypted profile (valid for 60 s).
3. The preview decrypts it, applies the owner check, creates the user and session in its own database and redirects to `/app`.

Requirements:

- Production must run a build that contains the plugin; until then preview sign-in fails at the production callback.
- Production and Preview must share the encryption secret: set the same `OAUTH_PROXY_SECRET` in both, or keep the same `AUTH_SECRET` in both. A dedicated `OAUTH_PROXY_SECRET` is preferred, so preview and production session secrets can differ.
- If the consent screen is in testing mode, `OWNER_EMAIL` must be a test user.

## Local environment

```sh
bunx vercel@latest env pull apps/web/.env.local --environment=development --scope mnigos-projects --yes
bun run db:migrate
bun run dev
```

The file is git-ignored. Never print it. Local sign-in uses the localhost redirect URI directly.

Signed-in screenshots without Google: `bun run --cwd apps/web dev:session` upserts "Sample User" (`sample@soonlane.test`) with a session in the development database and prints the session cookie; start the dev server with `OWNER_EMAIL=sample@soonlane.test` set in the shell and send that cookie. `dev:session --delete` removes the user and its sessions; the script refuses production envs, and it refuses to run unless `PRODUCTION_DATABASE_HOST` (the production Neon endpoint host, set in Vercel's development environment) is set and absent from the database URLs.

## Checks after a deployment

```sh
curl -s -X POST -H 'content-type: application/json' -d '{"json":null}' https://soonlist.vercel.app/api/rpc/system/health
# {"json":{"ok":true,"db":"ok","version":"<commit sha>"}}
curl -s https://soonlist.vercel.app/api/auth/get-session
# null
```

Then open the URL, sign in with the `OWNER_EMAIL` account and check the avatar and name in the sidebar. Any other Google account ends on `/login` with "Sign-in failed. Soonlane is only available to its owner."

The `pg` driver logs a warning about `sslmode=require` being treated as `verify-full`; it is not an error.

## Moving to soonlane.com

Run these steps once soonlane.com resolves to Vercel, in this order. Until then production stays on https://soonlist.vercel.app.

1. In the Vercel project, add `soonlane.com` and `www.soonlane.com`, and set `www.soonlane.com` to redirect (308) to `soonlane.com`. Keep `soonlist.vercel.app` assigned to production, so the old URL still serves the app.
2. In the Google OAuth client, add the origin `https://soonlane.com` and the redirect URI `https://soonlane.com/api/auth/callback/google`. Keep the `soonlist.vercel.app` entries until step 6.
3. Set `AUTH_URL` for Production to `https://soonlane.com`. It takes effect with the next production deployment.
4. Change `PRODUCTION_APP_URL` in `apps/web/src/platform/config/app-url.helper.ts` (the `oAuthProxy` production URL) and in `apps/desktop/src/platform/config/desktop.config.ts` (the desktop app's default `SOONLANE_URL`) to `https://soonlane.com`, and update the URLs in this file and in `README.md`. Merging it to `main` deploys production with the new `AUTH_URL` and proxy URL together.
5. Right after that deployment, set `soonlist.vercel.app` to redirect (308) to `soonlane.com`. Production trusts the `AUTH_URL` origin and its own deployment hosts (`VERCEL_URL`, `VERCEL_BRANCH_URL`), not `soonlist.vercel.app`, so requests that stay there would fail the origin check. Sessions are per host, so the owner signs in once more on soonlane.com, and the desktop app needs a build from step 4.
6. Run the checks above against https://soonlane.com, sign in with Google on production and on a preview, and check that both `www.soonlane.com` and `soonlist.vercel.app` redirect to the apex. Then remove the `soonlist.vercel.app` origin and redirect URI from the Google client.
