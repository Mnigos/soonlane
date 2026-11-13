# apps/site agent rules

- The public site on `soonlane.com`: landing, blog, changelog and legal pages. TanStack Start prerenders every page at build time and Caddy serves `dist/client` alone (`Dockerfile`, `Caddyfile`); nothing runs at request time, so no server function, no session read and no API call.
- Build inputs are `APP_ENV` and the optional `VITE_POSTHOG_KEY`. The app's and the API's origins and the cookie prefix come from `SITE_ENVIRONMENTS` (`modules/site/presentation/site-environment.constants.ts`), which must match `.railway/railway.ts`. Canonical URLs always use `SITE_URL` (`https://soonlane.com`).
- A file crawlers or feed readers fetch (`robots.txt`, `sitemap.xml`, `blog/rss.xml`) is a server route listed in `pages` in `vite.config.ts`, so the prerender writes it as a file. A new public page needs a link from a crawled page or its own `pages` entry, and a sitemap entry (`sitemap.helper.ts`).
- Links to the app are plain `<a>` on `APP_ORIGIN` ("Open app" to `/`, "Log in" and "Get started" to `/login`); the signed-in hint script in the root route picks between them before first paint (ADR 0008).
- Routes are declared in `src/routes.ts`; the root route is the document and the layout. Router state is read only in `*.route.tsx` (lint-enforced), as in `apps/web`.
- `scripts/check-static.ts` ends the build: a page for every sitemap URL, robots for this `APP_ENV` and the not-found page.
- Components take `Readonly<Props>` with the props interface right above them; follow `DESIGN.md` and the tokens in `tooling/tailwind-config/tokens.css`.
