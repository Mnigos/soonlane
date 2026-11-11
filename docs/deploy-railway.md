# Deploy on Railway

The API (`apps/api`) runs as the service `api` in the Railway project `Soonlane`, with one replica in Amsterdam (`europe-west4-drams3a`). Two environments: `production` at https://api.soonlane.com and `staging` at https://api.staging.soonlane.com ([ADR 0013](decisions/0013-three-hosts-on-railway.md)). The web app still deploys on Vercel ([deploy-vercel.md](deploy-vercel.md)).

## Configuration

`.railway/railway.ts` defines the service for both environments: Railpack builds from the repository root (`bun install --frozen-lockfile`, Bun 1.4.2 from `packageManager`), runs `bun run --cwd apps/api build` and starts `bun apps/api/dist/main.js`. Railway calls `GET /health` until it answers 2xx before it switches traffic, and gives the old deployment 10 seconds to finish its requests after SIGTERM.

Railway reads the file only when someone applies it, never during a deploy. After changing it, from a directory linked to the project:

```sh
bunx @railway/cli config plan --file <repo>/.railway/railway.ts --environment staging
bunx @railway/cli config apply --file <repo>/.railway/railway.ts --environment staging
```

and the same for `production`. The file exports `partial = 'soonlane'`, so an apply touches only what the file declares; Postgres and anything created by hand are left alone. Every variable of the service is managed by the file: a variable the file does not declare is deleted on apply, unless the file marks it `preserve()`. Custom domains must exist in Railway before the file can declare them (`railway domain <host> --port 8080`).

## Variables

| Variable          | Production                 | Staging                            |
| ----------------- | -------------------------- | ---------------------------------- |
| `PORT`            | `8080`                     | `8080`                             |
| `APP_ENV`         | `production`               | `staging`                          |
| `API_URL`         | `https://api.soonlane.com` | `https://api.staging.soonlane.com` |
| `TRUSTED_ORIGINS` | `https://soonlane.com`     | `https://staging.soonlane.com`     |

`TRUSTED_ORIGINS` is a comma-separated list of origins. The commit comes from `RAILWAY_GIT_COMMIT_SHA` on GitHub deploys. `railway up` uploads no git metadata, so the staging workflow writes `APP_COMMIT=<sha>` to `apps/api/commit.env` (gitignored, kept in the upload by `.railwayignore`) and the build inlines it into the bundle, ignoring any `APP_COMMIT` variable, so the commit always belongs to the uploaded code. The API refuses to start when a variable is missing or malformed and names it in the log.

## Staging

Staging has no repository connected, so a push deploys nothing. To deploy a branch, tag or commit, run the **Deploy staging** workflow (Actions, or `gh workflow run deploy-staging.yml -f ref=<ref>`). It checks out the ref, writes its commit into `apps/api/commit.env`, runs `railway up` with the `RAILWAY_TOKEN_STAGING` secret and waits until the deployment passes its health check. Then:

```sh
curl https://api.staging.soonlane.com/health
# {"ok":true,"environment":"staging","commit":"<sha>"}
```

## Production

Production builds `main` through Railway's GitHub connection with **Wait for CI**: Railway holds each push to `main` until the CI workflow on that commit has finished, skips the deploy if it failed, and deploys only when a watched path changed (`apps/api`, `tooling/typescript-config`, the root `package.json`, `bun.lock`, `bunfig.toml`). Nothing else deploys production; never run `railway up` against it.

## DNS

Records in Cloudflare (`soonlane.com` zone). `api.soonlane.com` is proxied, with SSL mode Full (not Full (strict)); `api.staging.soonlane.com` stays DNS only, since Cloudflare's universal certificate does not cover a host two levels deep. Nothing depends on Railway's generated `*.up.railway.app` host: the deploy health check runs inside Railway and the staging workflow reads the deployment status.

| Host                       | Type  | Name                          | Value                                                                  | Proxy     |
| -------------------------- | ----- | ----------------------------- | ---------------------------------------------------------------------- | --------- |
| `api.soonlane.com`         | CNAME | `api`                         | `dw86xh7f.up.railway.app`                                              | Proxied   |
| `api.soonlane.com`         | TXT   | `_railway-verify.api`         | `railway-verify=…` (`railway domain status api.soonlane.com`)          | DNS only  |
| `api.staging.soonlane.com` | CNAME | `api.staging`                 | `8jedkcb7.up.railway.app`                                              | DNS only  |
| `api.staging.soonlane.com` | TXT   | `_railway-verify.api.staging` | `railway-verify=…` (`railway domain status api.staging.soonlane.com`)  | DNS only  |
