# ADR 0013: Three hosts on Railway instead of one app on Vercel

**Status:** Proposed
**Date:** 2026-11-11
**Updated:** 2026-11-13

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

## Update 2026-11-12 (SOON-119)

Stage 1 shipped the shared session as follows; it replaces the Session cookie, API access and Old URLs points where they differ.

- **Cookie names.** Better Auth's base URL is the API's origin. Its `cookiePrefix` is `soonlane` in production and `soonlane-staging` on staging (`AUTH_COOKIE_PREFIX`), with `crossSubDomainCookies` on `soonlane.com` or `staging.soonlane.com` (`AUTH_COOKIE_DOMAIN`). The session cookie is `__Secure-soonlane.session_token`. The signed-in hint is `<prefix>.signed_in` (it was `soonlane-signed-in`) and copies the session cookie's attributes, so it shares its domain. The consent cookie is `<prefix>.consent` on the same domain (it was `soonlane-privacy`). The web learns the prefix at build time from `VITE_AUTH_COOKIE_PREFIX`.
- **API access.** The browser calls the API host directly (`VITE_API_URL`); the web app's `/api/auth` and `/api/rpc` forwarders are gone. The API's HTTP entry answers CORS for `/api/auth` and `/api/rpc` only for the exact origins in `TRUSTED_ORIGINS` and refuses every other `Origin` with 403, the API's own included. Google returns to `https://api.soonlane.com/api/auth/callback/google`. Return addresses must be absolute URLs on a trusted web origin, and `/sign-in/social` needs one in its body; Better Auth's errors go to the web `/login`.
- **Staging trust boundary.** Production's cookies are set on `Domain=soonlane.com`, so the browser sends them to every staging host too: the staging API receives a production session token on every browser call from someone signed in to production. Staging's Better Auth cannot use it, since it has its own `AUTH_SECRET` and reads only cookies with its own prefix. The staging web server forwards only its own session and consent cookies (`soonlane-staging.<name>`, `__Secure-soonlane-staging.<name>`, by exact name) to the API, but that covers server rendering only, not the browser's direct calls. Code deployed to staging could copy the token and use it against production, so staging runs only trusted refs, deployed by the team, and the API never logs the cookie header. A staging page can also read production's non-HttpOnly hint and consent cookies in the browser, which is accepted on the same terms.
- **No backward compatibility** (Igor, 2026-11-11). Old host-only cookies are not deleted; they expire on their own and no longer match any name the app reads. Everyone signs in once more and answers the consent banner again. Calendar links on `soonlane.com` stop working, and the old URLs get no redirect.

## Update 2026-11-12 (SOON-124)

Igor changed the order of stages 2 and 3 and the shape of stage 3 on 2026-11-12; this replaces the Stages list and the landing and robots points of the Consequences where they differ.

- **The whole site moves before the data.** `apps/web` builds one Bun server for the landing, the blog, the changelog, the legal pages and the app under `/app`, and runs as the Railway service `web` on `soonlane.com` and `staging.soonlane.com`. The app keeps `/app` until it moves to `app.soonlane.com` ([SOON-126](https://linear.app/rigtch/issue/SOON-126)); a static landing ([SOON-128](https://linear.app/rigtch/issue/SOON-128)) becomes an optimisation, not a step out of Vercel.
- **Vercel leaves the repository in the same change**, with no compatibility kept. Production switches once, the API and the site together, when Igor points DNS at Railway. Pointing DNS back at Vercel's last build is the way back while no migration lands.
- **The database stays on Neon** until [SOON-123](https://linear.app/rigtch/issue/SOON-123); both services in Amsterdam query it in Frankfurt.
- **The site keeps a server**, so `/robots.txt` stays rendered per request and `/ingest` stays on the web server.
- **Build variables.** The environment name and the blog's draft filter come from `APP_ENV`, the commit from `RAILWAY_GIT_COMMIT_SHA` or, for `railway up`, from `commit.env`; a production build still leaves drafts out.
- **Server rendering** calls the API on Railway's private network (`http://api.railway.internal:8080`), and the visitor IP it forwards follows the API's own rule: Railway's `X-Real-IP`, or `CF-Connecting-IP` when that address is a Cloudflare edge. The API listens on both IP stacks.
- **DNS.** `soonlane.com` is proxied by Cloudflare with SSL mode Full, like `api.soonlane.com`; `www.soonlane.com` reaches it through a Cloudflare redirect rule, not code.

## Update 2026-11-13 (SOON-126)

The app moved to `app.soonlane.com` (`app.staging.soonlane.com` on staging); this replaces the No /app prefix, API access and Old URLs points where they differ.

- **One service, two hosts.** Until [SOON-128](https://linear.app/rigtch/issue/SOON-128) the Railway service `web` serves both hosts and tells them apart by the request's host. The app's routes sit at their public paths (Upcoming at `/`, `/today`, `/labels/$name`, `/quick-add`, `/login`, `/desktop/sign-in`); the public pages sit under `/site` in the route tree, and a TanStack Router `rewrite` adds that prefix on every host but the app's (`VITE_APP_URL`) and takes it out of links. A link or redirect to the other host's page becomes an absolute URL on its origin (`VITE_APP_URL`, `VITE_SITE_URL`). `/health`, `/ingest` and `/robots.txt` answer on both hosts; prerendered pages are served only on the site host.
- **Old URLs get no redirect.** `soonlane.com/app`, `/app/today`, `/today` and `/login` answer 404, and the app host answers 404 for the public pages. Mac apps built for `https://soonlane.com` stop working until their update ([SOON-125](https://linear.app/rigtch/issue/SOON-125)) is installed.
- **The landing only links to the app.** "Open app" goes to `app.soonlane.com/`, "Get started" and "Log in" to its `/login`; the landing makes no API call.
- **The API trusts only the app's origin.** `TRUSTED_ORIGINS` and `APP_URL` are `https://app.soonlane.com` (`https://app.staging.soonlane.com` on staging); `soonlane.com` left the list. Calendar events link to the app's `/`. The cookie prefix and domain stay, so nobody signs in again, and Google's redirect URI stays on the API host.
- **One PostHog identity across both hosts.** With analytics granted, posthog-js keeps its identity in a cookie for the shared domain as well as localStorage; withdrawing consent deletes it there too.

## Update 2026-11-13 (SOON-128)

The landing, blog, changelog and legal pages moved to `apps/site`, a static app served by its own Railway service `site`; this replaces the One service, two hosts point and the server-kept site of the 2026-11-12 update.

- **A static site.** `apps/site` keeps the site's TanStack routes, head tags, MDX content and OG images, and TanStack Start prerenders every page at build time, with `robots.txt`, `sitemap.xml`, `blog/rss.xml` and a `404.html`. Caddy serves the files (`apps/site/Dockerfile`, `apps/site/Caddyfile`); nothing runs at request time. `soonlane.com` and `staging.soonlane.com` are the service's only domains.
- **Two build inputs.** `APP_ENV` picks robots (production allows crawling, other environments block it), the blog's draft filter and the app's and API's origins and cookie prefix from a constant map in the site; `VITE_POSTHOG_KEY` turns analytics and the consent banner on. Canonical URLs keep the fixed `https://soonlane.com`.
- **`web` serves only the app**, at root paths on any host, with a `robots.txt` that blocks every crawler. The host rewrite, the `/site` prefix, the prerender and the site's routes are gone. The app links to the legal pages and the changelog by absolute URL on `VITE_SITE_URL`.
- **`/ingest` is on the API host** (`https://api.soonlane.com/ingest`), with the same upstreams, header allowlist, timeouts and client IP as before. It answers CORS for `APP_URL` and the new `SITE_URL` only, without credentials. Both browser apps set PostHog's `api_host` to it.
- **A release rebuilds the site.** The `site` service watches `CHANGELOG.md` and `version.json`, and `/changelog` is prerendered from `CHANGELOG.md`. A post dated in the future still waits for the next production build.

## Update 2026-11-13 (SOON-129)

The data moved from Neon to Railway Postgres on 2026-11-12 between 22:04 and 22:14 UTC, and the repository names Vercel or Neon only in these records, the privacy policy, the vendored `.agents/skills/impeccable` skill and drizzle-orm's optional peers in `bun.lock`; the move's runbook, `docs/neon-to-railway-move.md`, lives in git history at the parent of the commit that deleted it.

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
