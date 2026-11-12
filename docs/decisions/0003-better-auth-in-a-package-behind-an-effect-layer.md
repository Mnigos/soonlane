# ADR 0003: Better Auth in packages/auth behind an Effect layer

**Status:** Accepted
**Date:** 2026-11-06

## Context

Sign-in (PR 2) first lived entirely in `apps/web/src/modules/identity`: the Better Auth config, the owner check, the browser client and the Effect layer in one module. ADR 0002 moves shared code into packages, and the desktop app will need the same owner policy and the same Better Auth server (its sign-in goes through the web app's `/api/auth`). rigtch-fm keeps Better Auth in `packages/auth` and lets NestJS wire it; Soonlist wires services through one Effect `ManagedRuntime`.

## Decision

- `packages/auth` owns the Better Auth configuration as a plain factory, `createAuth(options)` (`@soonlist/auth/server`): Google provider, owner-only user-create hook, `oAuthProxy` with `productionURL` `https://soonlist.vercel.app`, `tanstackStartCookies`, uuid ids, base path `/api/auth`, and log redaction (errors become their name).
- It also owns the browser client (`@soonlist/auth/client`: `authClient`, `signInWithGoogle`) and the pure owner policy at its root (`isOwner`, `canValidateSessions`, `isAuthConfigured`, `AuthUser`).
- The package has no Effect dependency. Configuration and the database arrive as arguments; logging arrives as a callback.
- `apps/web/src/modules/identity/infrastructure/better-auth.layer.ts` stays the only place that builds Better Auth: it reads `AppConfig` and `Db`, decides whether Google and the proxy are on, passes an Effect-backed logger, and exposes the `Auth` port to the rest of the app.
- `@soonlist/auth/server`, `@soonlist/db`, `pg` and `drizzle-orm` are denied in the client bundle by specifier in `apps/web/vite.config.ts`.

## Consequences

- The owner rule exists once, in the package, for every consumer.
- Changing a Better Auth option touches the package; changing when it applies (environment, secrets) touches the web layer and `AppConfig`.
- The web app does not depend on `better-auth` directly; only `@soonlist/auth` does.
- Rejected: an Effect `Layer` exported from the package (ties every consumer to the web app's Effect version and runtime), and keeping the config in the web module (the desktop app would copy the owner policy).

## Update 2026-11-12 (SOON-119)

The Effect layer moved to `apps/api/src/modules/identity/infrastructure/better-auth.layer.ts`. `oAuthProxy` and `tanstackStartCookies` are gone: previews no longer sign in, and the API carries the `Set-Cookie` values of a session refreshed during an RPC call (`getSession` with `returnHeaders`) on that response. The browser calls Better Auth on the API host directly; the web app has no `/api/auth` route.

## Related

- ADR 0002: package layout
- `packages/auth/AGENTS.md`, `ARCHITECTURE.md`: Sign-in
