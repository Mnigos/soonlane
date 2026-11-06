# packages/auth agent rules

- `@soonlane/auth/server` (`createAuth`) is server-only and imported only by `apps/web/src/modules/identity/infrastructure/better-auth.layer.ts`; `@soonlane/auth/client` is the browser client; the root exports the pure sign-up policy, the signed-in hint cookie name and the desktop sign-in contract (scheme, paths, parameters, PKCE helpers), which `apps/desktop` imports too.
- No Effect here: configuration, the database and the logger arrive as arguments.
- Every log argument goes through `redactLogArgument`; Drizzle errors embed session tokens.
- Production and previews run `oAuthProxy`; production must ship it before previews can sign in. Keep `AUTH_BASE_PATH`, the Google redirect URIs and `AppConfig.trustedOrigins` aligned.
