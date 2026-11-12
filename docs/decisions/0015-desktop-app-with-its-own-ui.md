# ADR 0015: The desktop app bundles its own UI from screens shared with the web app

**Status:** Proposed
**Date:** 2026-11-12

## Context

The desktop app ([ADR 0004](0004-desktop-shell-with-electrobun.md)) is a window that loads the hosted web app. It shows every screen the web app has, but it shows nothing without a network, every Quick Add press loads a page ([ADR 0010](0010-desktop-quick-add-and-dock-badge.md)), and it cannot have screens or offline behavior of its own (SOON-31). On 2026-11-12 Igor asked for a proper desktop app on macOS and Windows that shares its components with the web app (project [Desktop app](https://linear.app/rigtch/project/desktop-app-eef826a1e331), whose description holds the technical brief).

Facts this decision rests on:

- **Shared code.** The screens worth sharing live in `apps/web/src/modules/{tasks,labels,shell,calendar}/presentation`, about 7k lines. Their outside imports are the oRPC query utils (26 imports of `orpcQuery`), TanStack Router (11), `@soonlane/analytics` (23), the identity module's user menu (1) and the site constants (1). `@soonlane/ui` may not hold them: it has no router, data fetching or domain types ([ADR 0002](0002-package-layout.md)).
- **Session.** The session cookie is set on `.soonlane.com` with Better Auth's default `SameSite=Lax` ([ADR 0013](0013-three-hosts-on-railway.md)). A page bundled in the app is served from Electrobun's `views://` scheme, so its calls to the API are cross-site: a `Lax` cookie is not sent on them, and the webview would first need a cookie in its own store, which only a page on a `soonlane.com` host can get. URL parsing gives a `views://` page the opaque origin `null`, and the API's CORS allows only exact origins from `TRUSTED_ORIGINS` (the same list that holds the trusted return addresses after sign-in) and only the `content-type` request header.
- **Better Auth 1.7.18** ships a `bearer` plugin that reads the session token from an `Authorization: Bearer` header next to the cookie.
- **Electrobun 2.0.6** registers `urlSchemes` and emits `open-url` only on macOS; its config says "Windows: Not yet supported", and it has no single-instance lock. Upstream tracks both in [blackboardsh/electrobun#465](https://github.com/blackboardsh/electrobun/issues/465). The `soonlane://` return of [ADR 0007](0007-desktop-sign-in-through-the-system-browser.md) therefore cannot work on Windows, and on macOS it needs the app in `/Applications`.

## Decision

Igor decided on 2026-11-12:

- **Bundled UI.** The desktop app ships its UI inside the app: a TanStack Router single-page app in `apps/desktop`, loaded from `views://`. It no longer loads the hosted web app. Links to other origins, the public site included, open in the system browser as before.
- **`@soonlane/app`.** Screens shared by both apps move into a new package, `packages/app`. It holds feature components, hooks and their helpers, grouped as `src/modules/<module>/` like the web app's `presentation/` folders. It may import `@soonlane/ui`, `@soonlane/domain`, `@soonlane/contracts`, `@soonlane/analytics`'s browser client, TanStack Query and TanStack Router. It never imports an app, Effect, `@soonlane/db`, `@soonlane/auth/server` or anything server-only.
- **The host app provides what differs.** Each app that renders the package (the host app) provides, once at startup, the oRPC client the package's query utils use, and through a React provider the things only it knows: signing out, the user menu's account actions and links to the public site (the changelog link in the build info, the landing page). The package keeps the `orpcQuery` call shape, so most screens move with only their imports changed; the few that navigate to `/` or build a relative link to the public site go through the provider instead. The web app keeps one query client per request and the SSR request lookup inside its client, so providing the client once does not share state between visitors.
- **Routes stay in the host apps.** Route files, loaders and layouts stay in `apps/web` and `apps/desktop` and render the package's screens. Both apps serve the same app paths, which the package declares once as constants and links to only through them. Today they carry the `/app` prefix; when the app host drops it (ADR 0013, SOON-126), the constants and both route trees change in the same PR. The web app keeps SSR, the session layout, identity, the public site and the blog.
- **A token for the desktop app.** The desktop app signs in with a session of its own whose token it sends as `Authorization: Bearer`, through Better Auth's `bearer` plugin. The main process keeps the token in the macOS Keychain or the Windows Credential Manager and gives it to the page; the page never stores it. Signing out revokes that session. The API answers the bundled page's CORS without credentials and allows `authorization` for it, under a rule of its own: the page's origin never joins `TRUSTED_ORIGINS`, so it can never become a return address or receive the cookie. What origin WKWebView and WebView2 actually send from `views://` is checked in the spike (SOON-141) before the rule is written.
- **Loopback return.** The sign-in keeps ADR 0007's PKCE-bound one-time code and the deliberate click on "Open the desktop app", but the browser hands the code back through a redirect to `http://127.0.0.1:<port>/callback` instead of a `soonlane://` link (RFC 8252), on both systems. The app binds a port the OS picks, on the literal address `127.0.0.1` only, before it opens the browser. The sign-in page accepts only a loopback address with that fixed path as the destination. The listener takes one callback, ignores other paths, and closes after the exchange, on cancel or after the code's 2 minutes. The verifier stays in the main process's memory, as before.
- **macOS first, then Windows.** Windows builds start unsigned; SmartScreen warns until there is a certificate.

## Consequences

- The web app's behavior does not change. Moving screens is mechanical, but it collides with any open pull request that edits the same files, so each move lands when no task UI PR is open against those files, or rebases them.
- The API gains a second rule for the bundled page (no credentials, `authorization` allowed) in both places that check the origin today: `withCors` and the RPC handler's own guard, which refuses any origin outside `TRUSTED_ORIGINS` before it looks up the session. The cookie path and the return addresses keep the exact list. A bearer token is a second way into a session: it lives only in the OS credential store and the page's memory, and the council reviews the sign-in change.
- Signing out in the app still leaves the browser signed in, as in ADR 0007. The desktop session keeps the browser session's `createdAt`, so account deletion's fresh-session check holds.
- The app no longer has to sit in `/Applications` to sign in, and `bun run dev:applications` is no longer needed for it.
- The bundled UI can be older than the API. The API reports the oldest app version it supports and an older app asks to update (SOON-152), so contracts change additively until that ships.
- The two page messages of ADR 0010 stay; with the bundled UI they may move to Electrobun's typed RPC, which the stage C tickets decide.
- `UBIQUITOUS_LANGUAGE.md`, `ARCHITECTURE.md`'s layout and the agent rules gain the package and the host app terms in the PR that creates the package (SOON-144), and the token terms in the sign-in PR (SOON-148).
- Rejected: keeping the hosted page and adding only native features (no offline, a network round trip per window); Electron (Chromium in every download, a Node main process); a SwiftUI UI (nothing shared with the web app); putting the shared screens in `@soonlane/ui` (breaks its no-router, no-data rule); importing `apps/web` from the desktop app (an app never imports another app); a local server inside the app that serves the page on a domain the cookie covers (fragile and harder to secure); registering `soonlane://` on Windows ourselves (a registry entry plus single-instance forwarding outside Electrobun; offered upstream instead, SOON-143).

## Related

- [ADR 0002](0002-package-layout.md), [ADR 0004](0004-desktop-shell-with-electrobun.md), [ADR 0007](0007-desktop-sign-in-through-the-system-browser.md) (its `soonlane://` return is replaced), [ADR 0010](0010-desktop-quick-add-and-dock-badge.md), [ADR 0013](0013-three-hosts-on-railway.md)
- Linear: SOON-140 to SOON-156 in the Desktop app project
- `ARCHITECTURE.md`: Desktop app, Sign-in
