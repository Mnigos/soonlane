# ADR 0007: Desktop sign-in through the system browser with a PKCE-bound code

**Status:** Proposed
**Date:** 2026-11-06

## Context

Google refuses OAuth inside embedded webviews, so the desktop window ([ADR 0004](0004-desktop-shell-with-electrobun.md)) cannot show Google's page. The owner has to sign in in the system browser, and the session has to end up as a cookie in the window's WKWebView, on the web app's origin, because the window loads the hosted web app and has no UI of its own.

What the installed tools offer (read from `node_modules/better-auth` 1.7.18 and the Electrobun 2.0.6 SDK, not from memory):

- **Better Auth `oneTimeToken`.** `GET /one-time-token/generate` stores the caller's own session token behind a random token for 3 minutes; `POST /one-time-token/verify` consumes it and sets the cookie for that same session. Nothing binds the token to the app that asked for it.
- **Better Auth `deviceAuthorization`.** RFC 8628: the app polls for a bearer token while the user types a code in the browser. No deep link, a user-code page to build, and the token still has to become a cookie in the webview.
- **Better Auth `oauthPopup`.** Posts the result to `window.opener`, which a separate browser process does not have.
- **Electrobun.** `app.urlSchemes` registers a URL scheme and the global `open-url` event delivers its links. macOS only, and LaunchServices registers the scheme only for a copy of the app in `/Applications`. A blocked navigation still emits `will-navigate` with `{ url, allowed: false }`.

## Decision

- A small Better Auth plugin, `desktopSignIn()` in `packages/auth`, adds two endpoints that follow PKCE (S256):
  - `POST /api/auth/desktop-sign-in/code` (signed-in browser, Better Auth's origin check) takes the app's `challenge` and returns a 32-character code. The code is stored hashed in the `verification` table with the user id and the challenge, for 2 minutes.
  - `POST /api/auth/desktop-sign-in/exchange` takes `{ code, verifier }`, consumes the code first, checks `SHA-256(verifier)` against the stored challenge, then creates a new session for the user and sets its cookie.
- The desktop app keeps the verifier (32 random bytes) in memory only. "Continue with Google" in the window is a plain link to `/desktop/sign-in`; a navigation rule blocks that path in the window, and the blocked `will-navigate` makes the main process open `/desktop/sign-in?challenge=…` in the system browser.
- `/desktop/sign-in` signs the owner in with Google if needed (returning to the same URL), then waits for a click on "Open the desktop app", which creates the code and opens `soonlane://sign-in?code=…`.
- On `open-url` the main process takes the pending verifier, brings the window to the front and loads `/desktop/callback#code=…&verifier=…`. That page (client-only) calls the exchange, so the `Set-Cookie` lands in the webview's own cookie store, and then opens `/app`.
- The scheme is `soonlane`, the product's name ([ADR 0006](0006-rename-to-soonlane.md)). The contract the three sides share (scheme, paths, parameter names, the S256 helper) lives in `@soonlane/auth`; there is no separate desktop bridge package, because no other message crosses between the page and the main process.

## Consequences

- An intercepted `soonlane://` link is useless without the verifier, which never leaves the app; a link built from someone else's challenge fails the same check. A wrong verifier also spends the code.
- The desktop session is separate from the browser's: signing out in the app leaves the browser signed in, and signing in again from the app skips Google and needs only the click.
- The click is deliberate: a page that redirected on its own would hand a code to any app that registered `soonlane` and sent the owner a link with its own challenge.
- A sign-in started before the app quits cannot finish after a relaunch; the owner starts again.
- Electrobun's native layer logs every URL the window loads (`NSLog`, 2.0.6), so the callback URL with the code and the verifier reaches the macOS unified log. This exposure is accepted: the pair works only until the window's exchange spends the code, and never after the code's 2 minutes, and reading the log needs the owner's macOS account or an admin.
- Deep links need the app in `/Applications`. `bun run dev` cannot receive them; `bun run dev:applications` installs a dev build there and runs it against the local server. Only one installed copy should claim the scheme.
- Rejected: `oneTimeToken` (the app would share the browser's session, so signing out in the app signs the browser out, and the link alone is enough to take the session), `deviceAuthorization` (polling and a user-code page instead of a link), Electrobun RPC between the page and the main process (a navigation the rules block already says "start the sign-in", and the main process registers no RPC handlers).

## Related

- `packages/auth/src/desktop-sign-in.handler.ts`, `apps/desktop/src/modules/sign-in`, `apps/web/src/modules/identity/presentation/routes/desktop-*.route.tsx`
- [ADR 0003](0003-better-auth-in-a-package-behind-an-effect-layer.md), [ADR 0004](0004-desktop-shell-with-electrobun.md), [ADR 0005](0005-desktop-app-layout.md)
- `ARCHITECTURE.md`: Sign-in, Desktop app
