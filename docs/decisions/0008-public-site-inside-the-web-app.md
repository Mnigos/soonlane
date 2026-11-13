# ADR 0008: Public site inside the web app

**Status:** Proposed, partly superseded by [ADR 0013](0013-three-hosts-on-railway.md)
**Date:** 2026-11-06

[ADR 0013](0013-three-hosts-on-railway.md) moves Soonlane to three hosts on Railway and supersedes the rejection of a separate site app and of an `app.` subdomain under Options considered. It also replaces two points of the Decision: the app leaves the `/app` prefix on its own host, and `/robots.txt` becomes a build-time file per environment. Prerendering without environment variables and the signed-in hint still hold; since SOON-119 the hint cookie is named `<prefix>.signed_in` after the environment's cookie prefix (`soonlane.signed_in` in production), set by the API on the shared domain, and the web learns the name at build time from `VITE_AUTH_COOKIE_PREFIX`. Since SOON-124 the site is a Bun server on Railway and Vercel is gone: the server serves the prerendered pages from its build output and still renders `/robots.txt` per request ([ADR 0013](0013-three-hosts-on-railway.md), update of 2026-11-12). Since SOON-126 the app is on `app.soonlane.com` without `/app`, the public pages sit under `/site` in the route tree behind a rewrite by host, and the prerendered pages are served only on the site host ([ADR 0013](0013-three-hosts-on-railway.md), update of 2026-11-13). Since SOON-128 the public pages are their own static app, `apps/site`, which Caddy serves on the Railway service `site`: `/robots.txt` is a file written per environment at build, the signed-in hint script is unchanged, and `apps/web` keeps only the app ([ADR 0013](0013-three-hosts-on-railway.md), update for SOON-128). The text below stays as written.

## Context

Soonlane became a public product on 2026-11-06 ([ADR 0009](0009-open-sign-in.md)). Google's brand verification for Sign in with Google needs a public homepage that describes the app and links a privacy policy on the same domain; a login page alone does not count. Until now `apps/web` had no public pages: `/` redirected into the app, and the root route's `beforeLoad` called `identity.me` on every request, so every page read the session and needed the database.

The site has to stay cheap and fast for visitors who never sign in, must not compete in search with previews or `soonlist.vercel.app`, and still has to show "Open app" to someone who is signed in.

## Decision

- The public pages live in `apps/web`, in `modules/site`, under a pathless `site` layout: `/`, `/privacy` and `/terms` now; the blog and changelog join later. The app moved to `/app` (Upcoming) and `/app/today` (SOON-39).
- Routes that read the session sit under a pathless `session` layout (`/app`, `/login`, `/desktop/sign-in`, `/desktop/callback`). Its `beforeLoad` calls `identity.me` and its `head` adds `noindex, nofollow`. The root route reads nothing; public routes never read the session and never touch `AppConfig`, `Db` or Better Auth.
- Public pages are prerendered at build time by TanStack Start (`prerender` and `pages` in `apps/web/vite.config.ts`, with `isPublicPath` keeping session routes out of the crawl). Nitro writes them to `.vercel/output/static`, and Vercel serves that directory before the `__server` function. The build therefore runs without any environment variables.
- Legal text is MDX in `modules/site/content`, compiled at build time by content-collections.
- The canonical origin is the constant `SITE_URL = 'https://soonlane.com'`, never derived from the request or env. Canonical links, Open Graph URLs and the sitemap use it. `/robots.txt` is a per-request server route: on the host `soonlane.com` it allows `/` and disallows `/app`, `/api/`, `/login` and `/desktop/`; every other host gets `Disallow: /`. `/sitemap.xml` is prerendered from one entry list.
- The header and the landing call to action learn the sign-in state from the `soonlane-signed-in=1` hint cookie (ADR 0009). An inline script in the root route's head marks `<html data-signed-in>` from the cookie before first paint, and again whenever the tab becomes visible; the site layout's `onEnter` re-reads it after a client-side navigation into the site. The prerendered HTML holds both variants, and the `signed-in:` Tailwind variant shows "Open app" or "Log in", "Get started" and the terms note, so nothing swaps after hydration. No session request is made on public pages.

## Consequences

- Public pages cost no function invocation and no database query; a Neon or auth outage leaves them up.
- A stale hint only changes which links show: "Open app" leads to `/login` when the session is gone.
- The hidden variant ships in every prerendered page; `display: none` keeps it out of the accessibility tree and the tab order.
- Every public route must render without env vars. A route that reaches `AppConfig`, `Db` or Better Auth fails the prerender step, and so the build.
- A new public page needs an entry in `pages` (or a crawlable link from one) and in `SITEMAP_ENTRIES`.
- The app shell's chunks are not modulepreloaded on public pages; the Better Auth browser client is, because "Get started" starts Google sign-in on click.

## Options considered

- **A separate app** (for example `apps/site`): a second deployment, duplicated design tokens and layout, and the sign-in button would have to cross origins. Rejected while the site is a handful of pages.
- **A subdomain `app.soonlane.com`**: sessions, the Google OAuth client, the desktop app's `SOONLANE_URL` and the OAuth proxy would all have to move. Rejected; `/app` on one origin keeps one cookie scope.
- **Rendering the landing or the app at `/` depending on the session**: `/` could not be prerendered, every visit would read the session, and search engines would see a page that changes with cookies. Rejected.

## Related

- `apps/web/src/routes.ts`, `apps/web/vite.config.ts`, `apps/web/content-collections.ts`, `apps/web/src/modules/site`
- `ARCHITECTURE.md`: Public site; `docs/deploy-vercel.md`: Checks after a deployment
- [ADR 0009](0009-open-sign-in.md): the signed-in hint cookie
