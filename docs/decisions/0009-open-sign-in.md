# ADR 0009: Open sign-in for any Google account

**Status:** Proposed
**Date:** 2026-11-06

## Context

Until now Soonlane let in one Google account, `OWNER_EMAIL` ([ADR 0003](0003-better-auth-in-a-package-behind-an-effect-layer.md)): the user-create hook rejected everyone else, and `requireOwner` and `identity.me` checked the address again on every request. On 2026-11-06 Soonlane became a public product, so anyone can sign up and gets a private task list. Data was already per user: `task.owner_id` references `user.id` with `onDelete: cascade`, and every `TaskRepository` query filters by `ownerId`.

What Better Auth 1.7.18 offers (read from `node_modules/better-auth`, not from memory):

- `user.deleteUser` deletes at once when no verification email is configured. Without a password it requires a fresh session: a session older than `session.freshAge` (default one day) gets `SESSION_EXPIRED`.
- `rateLimit` with `storage: 'database'` keeps one row per client IP and path in a `rateLimit` model (`key`, `count`, `lastRequest` in ms) and updates it atomically. It is on only in production by default, and the memory store is per process.
- The limiter reads the client IP from `advanced.ipAddress.ipAddressHeaders` (default `x-forwarded-for`) and trusts a header only when it holds a single address. [Vercel overwrites `x-forwarded-for`](https://vercel.com/docs/headers/request-headers#x-forwarded-for) with the client's address and does not forward one a client sends.

## Decision

- Any Google account whose address Google reports as verified can create an account. `ALLOWED_EMAILS` (comma-separated, trimmed, lowercase) is optional: when set, only those addresses can create an account, and existing accounts keep signing in. Production, previews and development run without it; it exists for self-hosted copies and to close sign-ups quickly. A rejected sign-up returns to `/login?error=SIGN_UPS_CLOSED`.
- `requireUser` replaces `requireOwner`: `UNAUTHORIZED` without a session, otherwise `context.user`. "Owner" now means the owner of a task; the `owner_id` column and the `ownerId` parameters stay. The `FORBIDDEN` contract error is gone.
- "Delete account" in the user menu calls `/delete-user` after a confirmation dialog. It keeps Better Auth's default `freshAge`, so a session older than a day must sign in with Google again first. A desktop hand-off never makes a session fresher than its source: the desktop session keeps the browser session's `createdAt`. To re-authenticate in the desktop app, the dialog opens `/desktop/sign-in?fresh=true`, which goes through Google even when the browser is signed in. The re-authentication passes the current address as Google's `login_hint`. The cascades remove sessions, accounts and tasks with the user.
- Better Auth rate limits `/api/auth` in Postgres (`rate_limit` table), also outside production: 100 requests a minute per IP, 10 a minute for `/sign-in/social`, `/desktop-sign-in/code` and `/desktop-sign-in/exchange`, 5 an hour for `/delete-user`. It keys on `x-forwarded-for` only.
- An after hook sets `soonlane-signed-in=1` (not HttpOnly, the session cookie's `Secure` and `SameSite=Lax`, the session lifetime) whenever a request creates or refreshes a session, including the desktop code exchange, and clears it after sign-out and a successful deletion. It carries no user data; static pages read it to show "Open app" instead of "Log in".

## Consequences

- ADR 0003's owner-only hook and owner policy are superseded; the rest of ADR 0003 stands. Its text stays as written.
- A stale or missing hint only changes which header link a static page shows; the session cookie still decides access.
- On Vercel a request whose `x-forwarded-for` is missing or holds a chain falls into one shared bucket per path. Behind another proxy in front of Vercel, the limiter would need `x-vercel-forwarded-for` or `trustedProxies`.
- Every request to `/api/auth` now writes to `rate_limit`; Better Auth prunes rows older than the longest window (one hour) when a window resets.
- Rejected: memory storage for the limiter (each Vercel function instance would count alone), `x-real-ip` and `x-vercel-forwarded-for` (Vercel's docs promise the overwrite only for `x-forwarded-for`), a custom `freshAge` (the one-day default already asks for a recent Google sign-in), keeping the owner gate behind a flag (two code paths for one product).

## Related

- `packages/auth/src/better-auth.config.ts`, `packages/auth/src/auth-policy.helper.ts`, `apps/web/src/modules/identity/presentation/require-user.middleware.ts`
- [ADR 0003](0003-better-auth-in-a-package-behind-an-effect-layer.md), [ADR 0007](0007-desktop-sign-in-through-the-system-browser.md)
- `ARCHITECTURE.md`: Sign-in; `docs/deploy-vercel.md`: Environment variables
