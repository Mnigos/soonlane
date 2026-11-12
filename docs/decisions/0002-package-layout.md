# ADR 0002: Package layout with separate contracts, domain, ui, db and auth packages

**Status:** Accepted
**Date:** 2026-11-06

## Context

Soonlist starts as one TanStack Start app, but a desktop app is next and will call the same `/api/rpc` API. The first skeleton kept UI primitives, `cn`, the tsconfig base and the Tailwind tokens inside `apps/web`, which would force the desktop app to copy them or import from the web app. The owner wants the foundation in place before features land, following the layout of rigtch-fm (`packages/{auth,contracts,db,domain,ui}`, `tooling/{typescript-config,tailwind-config,oxlint-plugins}`), adapted to Effect 4 instead of NestJS.

## Decision

- `packages/contracts`: the oRPC contract and Zod schemas, the only API boundary, composed from the domain's brand schemas. Browser-safe.
- `packages/domain`: brands (`CalendarDate`, `UserId`), each a Zod schema with the type inferred from it, shared constants and pure domain logic both apps run (date helpers, repeat rules, the cookie reader; SOON-119). No workspace dependencies; `zod` only in the brand schema files.
- `packages/ui`: app-agnostic React primitives and `cn`, consumed through an export map (`@soonlist/ui/components/*`, `@soonlist/ui/cn`) with no barrel. No router, data fetching or domain types.
- `packages/db`: Drizzle schema, migrations and the migrator. Server-only.
- `packages/auth`: the Better Auth factory (Google, owner-only hook, oAuthProxy) and the browser client. The web app wraps the server factory in an Effect layer; the package itself stays free of Effect so the desktop app's tooling can reuse it.
- `tooling/typescript-config` (tsconfig presets), `tooling/tailwind-config` (Tailwind 4 theme and Todoist-like tokens), `tooling/oxlint-plugins` (`soonlist/*` rules).
- Dependencies point one way: apps → `auth` → `db` → `domain`; apps → `contracts` / `ui` → `domain`.
- Effect services, ports and layers stay in `apps/web`. Packages export plain functions and data; the app decides how they enter the `ManagedRuntime`.
- Scope `@soonlist/*` for every workspace.
- No `packages/utils` until there is shared code that is neither UI nor domain; `cn` lives in `packages/ui`.

`db` and `auth` arrive with sign-in (PR 2); the rest with the skeleton (PR 1).

## Consequences

- Import protection in `apps/web/vite.config.ts` must also cover server-only package entries (`@soonlist/db`, `@soonlist/auth/server`), since their files sit outside the app's folder patterns.
- Every workspace declares the workspace packages it imports; Bun's isolated linker does not hoist undeclared ones.
- Tailwind scans `packages/ui` through `@source` in `apps/web/src/styles.css`; a new package with classes needs its own `@source`.
- Moving code into a package is cheap but not free: each package has its own `package.json`, tsconfig and lint scope. Code stays in `apps/web` until a second consumer exists.
- Rejected: one `packages/shared` grab bag (blurs browser and server code), and Effect services inside packages (would tie the desktop app's build to Effect's runtime choices made for the web app).

## Update 2026-11-12 (SOON-119)

The server code moved to `apps/api`, so Effect services, ports and layers now live in both apps. The web app no longer depends on `@soonlane/db`, `@soonlane/auth/server`, `pg` or `drizzle-orm`, so its import protection no longer lists them.

## Update 2026-11-12 (SOON-137)

`tooling/oxlint-plugins` is now `tooling/oxlint-plugin` (`@soonlane/oxlint-plugin`), because it holds one plugin. `soonlane.plugin.mts` stays at its root, the rules sit in `rules/` and their shared helpers in `helpers/`.

## Related

- `ARCHITECTURE.md`: Monorepo layout, Package layering
- ADR 0001: naming and layering conventions
- [ADR 0013](0013-three-hosts-on-railway.md): adds `apps/api` for the Effect server code and moves `modules/tasks/domain` to a package both apps import, under the second-consumer rule above
