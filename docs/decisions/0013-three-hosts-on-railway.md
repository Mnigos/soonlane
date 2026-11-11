# ADR 0013: Three hosts on Railway instead of one app on Vercel

**Status:** Proposed
**Date:** 2026-11-11

## Context

Soonlane runs as one TanStack Start app (`apps/web`) on Vercel in `fra1`, with Postgres on Neon in Frankfurt. That one deployment serves the prerendered public pages, the app with SSR, Better Auth at `/api/auth`, oRPC at `/api/rpc`, the calendar feed and the PostHog proxy. The Vercel build also runs the migrations. The Mac app loads that origin in a WKWebView.

The server code works around Vercel's function model. Analytics sends every event with `captureImmediate` because a function can freeze after the response. Better Auth keeps rate limits in Postgres because instances share no memory. `AppConfig` derives the base URL, the trusted origins and the OAuth proxy switch from `VERCEL_*` variables, and the build depends on the Nitro `vercel` preset.

On 2026-11-11 Igor decided to split the app into separate services and to leave Vercel and Neon ([SOON-115](https://linear.app/rigtch/issue/SOON-115), project [Soonlane on Railway](https://linear.app/rigtch/project/soonlane-on-railway-66b76785820a)). The project description holds the technical brief, the verified Railway facts and the open questions. This ADR records the decisions and the parts of [ADR 0008](0008-public-site-inside-the-web-app.md) they replace.

## Decision

Igor decided three points on 2026-11-11:

- **Three hosts, one session.** `soonlane.com` serves the landing, blog, changelog and legal pages. `app.soonlane.com` serves the task list with SSR. `api.soonlane.com` serves oRPC, Better Auth, the calendar feed and the analytics proxy. Postgres sits on Railway's private network.
- **Two permanent environments.** Production deploys from `main`. Staging deploys only on demand, from a branch someone picks. There is no environment per pull request.
- **The database moves with downtime.** Almost nobody uses the app yet, so one planned outage at any hour is acceptable. There is no live replication.

Five defaults from the project brief, to which Igor has not objected:

- **Staging hosts.** `staging.soonlane.com`, `app.staging.soonlane.com` and `api.staging.soonlane.com`, with a session of their own.
- **No new API framework.** The API stays Effect and oRPC and runs as a long-lived Bun process.
- **One more sign-in.** Everyone signs in again when the session cookie changes scope, and the Mac app gets a new release with the new address.
- **No `/app` prefix.** The app drops `/app` on its own host. Old URLs and calendar links redirect permanently.
- **A static landing.** The landing keeps today's code and becomes a fully static app.

How the pieces fit:

- **Session cookie.** Better Auth sets the session cookie on `.soonlane.com` through `advanced.crossSubDomainCookies` with `domain: 'soonlane.com'`. The release that widens the scope also sets a new `advanced.cookiePrefix`, so a browser that still holds the old host-only cookie never sends two cookies under one name. The `soonlane-signed-in` hint and the `soonlane-consent` cookie move to `.soonlane.com` too. The three hosts share one registrable domain, so the cookie is first-party on all of them. Railway's `*.up.railway.app` hosts are on the public suffix list, so shared sign-in needs the custom domains.
- **API access.** The API answers CORS with credentials only for the origin that serves the app, from an exact allowlist, never `*`. That origin is `https://soonlane.com` in stages 1 and 2 and `https://app.soonlane.com` from stage 3. The landing's "Get started" button starts Google sign-in from `https://soonlane.com` itself, so that origin stays on the list until the stage that moves the landing either keeps it or points the button at the app's `/login`. The browser clients send `credentials: 'include'`, and the Better Auth client points at the API origin. Google's redirect URI becomes `https://api.soonlane.com/api/auth/callback/google`, and the `oAuthProxy` plugin goes away with Vercel previews.
- **Staging session.** Staging uses its own `cookiePrefix` and `domain: 'staging.soonlane.com'`.
- **Deploys.** Every staging service has auto-deploy switched off. A deploy runs `railway up` from the chosen checkout, for example in a GitHub Actions job with a token scoped to the staging environment. Railway configuration lives in `.railway/railway.ts`.
- **Migrations.** They run in a Railway pre-deploy command, which runs after the build and can reach the private network. The ticket that sets it up picks the service. If the command fails, Railway stops the deploy and the previous deployment stays live.
- **Region.** Every service and Postgres run in Railway's only EU region, EU West in Amsterdam (`europe-west4-drams3a`).
- **Old URLs.** `/app`, `/app/today`, `/app/labels/$name`, `/login` and `/today` on `soonlane.com` redirect permanently to `app.soonlane.com`. Subscribed calendar links (`https://soonlane.com/calendar/<token>.ics`) keep working for as long as the product exists, through a permanent redirect or, if calendar apps do not follow one, a proxy to the API.
- **Code layout.** A new `apps/api` workspace takes the server code from `apps/web`: `platform/`, the `application/` and `infrastructure/` folders of each module, the routers, `require-user.middleware.ts` and the server routes. Effect services stay in an app, as [ADR 0002](0002-package-layout.md) requires. `modules/tasks/domain` is used by the services and by the UI, so it moves to a package both apps can import, most likely `packages/domain` or a new package. ADR 0002 allows the move once a second consumer exists. The stage that moves the code picks the package.

What stays from ADR 0008:

- Public pages are prerendered at build time and need no environment variables. A public route that reaches `AppConfig`, `Db` or Better Auth still fails the build.
- The `soonlane-signed-in` hint cookie decides whether a public page shows "Open app" or "Log in". Public pages never read the session.

ADR 0008's rejection of a separate site app and of an `app.` subdomain no longer holds. The rest of ADR 0008 stands until a later stage changes it.

## Stages

0. Foundation: the Railway project, both environments, the deploy rules and this ADR.
1. The API runs on Railway. The web app stays on Vercel and calls it over HTTP. The database stays on Neon.
2. The database moves from Neon to Railway in one planned outage.
3. The web app runs on Railway at `app.soonlane.com`. Vercel serves the landing and redirects the old app URLs.
4. The landing runs as its own static app on Railway. Vercel and Neon are switched off.

Each stage ends in a state that can stay in production for weeks.

## Consequences

- Each host deploys on its own. The API becomes a long-lived process, so analytics can batch events and flush them on shutdown instead of sending each one at once.
- A single region replaces Vercel's edge. Cloudflare caches the landing, and time to first byte is measured before and after each switch.
- Between stages 1 and 2 the API in Amsterdam queries Neon in Frankfurt across regions.
- Any subdomain of `soonlane.com` can read and overwrite a `.soonlane.com` cookie. Nothing untrusted may be hosted on a subdomain. Production cookies also reach the staging hosts, which is acceptable only while Igor runs both.
- The landing loses its server. `/robots.txt` becomes a build-time file per environment, and `/ingest` moves to the API host or a Cloudflare rule.
- Railway Postgres has point-in-time restore only as a separately billed option. A scheduled dump goes to storage outside Railway, and one restore drill runs before the cutover. Neon stays untouched for 14 days after it. Going back to Neon after Railway has taken writes needs a second write freeze and a dump from Railway restored into Neon, checked by row counts the same way.
- The build reads `VERCEL_ENV` and `VERCEL_GIT_COMMIT_SHA` for the environment name, the version and the blog's draft filter. Stage 3 replaces them with variables Railway sets, and every production build still leaves draft posts out.
- Later tickets rewrite `ARCHITECTURE.md`, `README.md`, `docs/deploy-vercel.md` and `docs/release.md`.
- Risks:
  - The rate limiter must not trust a client IP header until a test shows clients cannot forge it on Railway.
  - The cutover could lose rows. The write freeze and row counts on both sides guard against it, and Neon is the way back.
  - Calendar apps may not follow a permanent redirect on a subscribed feed. Then the old path proxies to the API.

## Options considered

- **Stay on Vercel and add a separate API.** The app would keep the function model it works around today, and the product would run on two platforms. Igor chose to leave Vercel.
- **One host with path routing in front of three services.** It keeps one cookie scope and today's URLs. But a proxy (a Cloudflare Worker or a fourth service) would sit in front of every request, and each environment would need its own copy, kept in sync with the routes of three services.
- **Move the services and keep Neon.** The API in Amsterdam would query a database in Frankfurt for good. Igor chose to leave Neon.

## Related

- [Soonlane on Railway](https://linear.app/rigtch/project/soonlane-on-railway-66b76785820a): technical brief, Railway facts, open questions, tickets SOON-114 to SOON-129
- [ADR 0002](0002-package-layout.md): package layout; `apps/api` and the shared tasks domain code
- [ADR 0007](0007-desktop-sign-in-through-the-system-browser.md): desktop sign-in, whose round trip through Google now passes the API host
- [ADR 0008](0008-public-site-inside-the-web-app.md): partly superseded by this ADR
- [ADR 0009](0009-open-sign-in.md): the signed-in hint cookie and rate limits
- [ADR 0011](0011-private-calendar-subscription-link.md): the calendar link that must keep working
