# ADR 0016: Todoist linked through Better Auth for at most 15 minutes

**Status:** Proposed
**Date:** 2026-11-12

## Context

Importing from Todoist ([SOON-110](https://linear.app/rigtch/issue/SOON-110), project [Todoist import](https://linear.app/rigtch/project/todoist-import-80f3d74b175c)) needs a Todoist access token on the API for one read of the user's account. The project brief first said the token is never written to the database: a hand-written OAuth route would hold it in memory for the length of one request. Todoist's consent screen and its callback are two browser requests, so the token would have to survive between them somewhere anyway, and a hand-written flow repeats what Better Auth already does: the state cookie bound to the browser, PKCE, the `redirect_uri` that Todoist requires when an app lists several, and the link bound to the session that started it.

Better Auth 1.7.18, the locked version (verified against `node_modules`, not from memory, and also read in 1.7.22), runs any provider of its `genericOAuth` plugin through the core `/sign-in/social`, `/link-social` and `/callback/:id` endpoints. A link writes the provider's tokens to `account`, encrypted with `AUTH_SECRET` when `account.encryptOAuthTokens` is on. `disableSignUp` stops a new user, but nothing in the plugin stops a sign-in through a provider whose `account` row exists.

## Decision

- Todoist is a `genericOAuth` provider (`todoist`, scope `data:read`) configured in `createAuth` only when `TODOIST_CLIENT_ID` and `TODOIST_CLIENT_SECRET` are both set. Its user info comes from the Sync API's user resource, since Todoist has no OIDC userinfo.
- It is a link, never a sign-in: `/sign-in/social` refuses `todoist` before a state exists, the provider's user info is `null` unless the parsed state is a signed-in user's link (so a replayed sign-in state creates no user, account or session), and `/link-social` accepts only `todoist`, with no scopes or parameters beyond the return addresses, and only while the user has no `todoist` row. `todoist` is a trusted provider, because Todoist reports no verified address; its user info carries the linking user's own email, so Better Auth's same-email check passes for Todoist alone and Google keeps it.
- `encryptOAuthTokens` is on for every provider. The endpoints that hand a stored token to the browser (`/get-access-token`, `/refresh-token`, `/account-info`) and `/unlink-account` are disabled; the API decrypts the token through Better Auth's own cipher.
- Tokens from a callback that ends without a row holding them (no user info, the starting session gone, the Todoist account linked to someone else) are revoked by an after hook on the callback, best effort, since nothing durable holds them. A `todoist` row is never updated, so a link always creates a new row.
- The `todoist` row lives at most 15 minutes from the link. The API revokes both tokens at Todoist (RFC 7009) and deletes the row on cancel, on a failed read, before a new link, and from a sweep that runs every minute in the API's runtime. A failed revocation keeps the row for the next sweep, and cancel then fails, so no new link starts; after an hour, when the access token is dead, the row goes anyway.
- The desktop app opens the import page in the system browser, where the state cookie and the session live ([ADR 0007](0007-desktop-sign-in-through-the-system-browser.md)).

## Consequences

- The token is in the database, encrypted, for up to 15 minutes (an hour while Todoist refuses revocations). A database dump without `AUTH_SECRET` does not reveal it; rotating `AUTH_SECRET` makes stored tokens unreadable, which the sweep then deletes after an hour.
- Google sign-ins from now on store encrypted tokens; existing plaintext Google tokens stay readable, because Better Auth decrypts only values that look encrypted. Soonlane reads no Google token.
- A signed-in user can no longer call `/link-social` for Google, `/unlink-account` or the token endpoints; the app used none of them.
- A Todoist account can be linked to one Soonlane user at a time; another user who tries within the 15 minutes gets "already connected to another account".
- Two links racing: the later callback reports success, but its tokens are revoked and the earlier row is kept.
- Tokens from a callback that ends without a row are revoked best effort in the callback's after hook; a database error inside the callback, or a failed revocation at that moment, leaves them unrevoked and held by nothing until the access token expires (1 hour), and the grant stays listed in Todoist's settings.
- If Todoist does not confirm a refresh-token revocation, the row, and so a new link, stays blocked for up to an hour (to be confirmed on the manual run).
- Deleting the Soonlane account deletes the row by cascade without revoking at Todoist; the stored refresh token goes with it, and the grant stays listed in the user's Todoist settings until it expires or they remove it.
- Rejected: a hand-written OAuth route with the token in memory (repeats state, PKCE and session binding, and still has to carry the token between requests); Better Auth's `getAccessToken` server API to read the token (it returns only the access token, and revocation needs the refresh token too).

## Related

- `packages/auth/src/todoist-link.handler.ts`, `packages/auth/src/better-auth.config.ts`, `apps/api/src/modules/todoist`, `apps/web/src/modules/todoist`
- [ADR 0003](0003-better-auth-in-a-package-behind-an-effect-layer.md), [ADR 0007](0007-desktop-sign-in-through-the-system-browser.md), [ADR 0014](0014-repositories-without-ports.md)
- `ARCHITECTURE.md`: Sign-in, Todoist import
