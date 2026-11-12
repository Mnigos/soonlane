# packages/auth agent rules

- `@soonlane/auth/server` (`createAuth`) is server-only and imported only by `apps/api` (`createAuth` only in `modules/identity/infrastructure/better-auth.layer.ts`); `@soonlane/auth/client` is the browser client; the root exports the pure sign-up policy, the signed-in hint's name for a cookie prefix (`getSignedInHintCookie`) and the desktop sign-in contract (scheme, paths, parameters, PKCE helpers), which `apps/desktop` imports too.
- No Effect here: configuration, the database and the logger arrive as arguments.
- Every log argument goes through `redactLogArgument`; Drizzle errors embed session tokens.
- Better Auth reads the client IP only from `CLIENT_IP_HEADER`, which the API's HTTP entry sets. Keep `AUTH_BASE_PATH`, the Google redirect URIs (on the API host) and the API's `TRUSTED_ORIGINS` aligned.
- Cookie names come from the caller's `cookiePrefix`; never a fixed name. Return addresses are validated by the `returnAddresses` plugin (`onRequest`, before Better Auth's own checks) against `trustedOrigins` only, never Better Auth's own list, which also trusts relative paths and the API's origin.
