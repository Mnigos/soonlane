# Soonlist agent rules

Personal Todoist-like task list for one owner. Bun + Turborepo; TanStack Start (React 19, Router, Query) on Vercel; Effect 4 on the server; oRPC v2; Drizzle on Neon Postgres; Better Auth (Google, owner-only); Tailwind 4; oxlint/oxfmt via Ultracite. Map: `ARCHITECTURE.md`. Product and look: `PRODUCT.md`, `DESIGN.md`.

## Must

- Never read `.env` files or print secrets.
- Commit only when asked. Conventional commits (commitlint runs in the hook and CI); never `--no-verify`. No AI attribution anywhere: no `Co-Authored-By`, no "Generated with".
- Never edit `CHANGELOG.md` or `version.json` in a PR; only the release workflow writes them (`docs/release.md`).
- No unit tests and no test frameworks. The gates are `bun run check`, `bun run typecheck` and `bun run build`.
- "Today" is the user's local day, read in the browser (`useToday`). Never derive it from the server clock.

## Boundaries

- Packages: `domain` (brands, no workspace deps) ← `contracts` (the only API boundary, oRPC + Zod) and `ui` (app-agnostic primitives: no router, data fetching or domain types); `domain` ← `db` (Drizzle schema, migrations; server-only) ← `auth` (`createAuth` at `/server`, server-only; browser client at `/client`; owner policy at the root). Packages never import an app and never use Effect; the web app wraps them in layers.
- `apps/web/src/modules/<module>/`: `domain/` is pure (no Effect services, framework, ORM or RPC); `application/` holds ports and services (`Context.Service`, `*Live` layer, `Effect.fn('Service.method')`); `infrastructure/` implements ports (repositories run queries through `Db.run` and never catch); `presentation/` holds routers, middleware, components, hooks, routes.
- `apps/desktop/src/` uses the same `platform/` and `modules/<module>/{domain,application,infrastructure}` split; Electrobun is imported only in `infrastructure/`, `platform/electrobun/` and `main.ts`.
- `apps/web/src/platform/`: config, `AppLive`, the single `ManagedRuntime`, oRPC wiring. Tagged errors (`Data.TaggedError` with `code`) become oRPC errors only in `platform/rpc/rpc.base.ts`.
- Server-only: `platform/`, `application/`, `infrastructure/`, `*.router|handler|port|service|repository|layer|middleware.ts`, `*.server.*`, `routes/api.*`, and the specifiers `@soonlist/auth/server`, `@soonlist/db`, `pg`, `drizzle-orm`. The client may import only the four browser-safe oRPC files in `platform/rpc` (`rpc.client.ts`, `rpc-query.client.ts`, `rpc-prefix.constants.ts`, `rpc-serializer.constants.ts`). Import protection fails the build otherwise.

## Code

- File names: `<kebab-name>.<role>.ts` with a role from `base, client, config, constants, context, contract, errors, handler, helper, layer, layers, middleware, parser, port, repository, router, runtime, schema, schemas, service, types, util` (optional `.server` modifier). Components are bare kebab-case `.tsx`, hooks `use-*.ts`, routes `*.route.ts(x)`. (lint-enforced)
- No barrel files, except one root `index.ts` per package (`packages/ui` has none; import through its export map).
- No `useEffect` and no `useSuspenseQuery`; use `useQuery`/`useMutation` with `queryOptions()`/`mutationOptions()` from `orpcQuery`. (lint-enforced)
- Runtime only in the file suffix (`.server.ts`), never in identifiers.
- Implementation files stay under 400 lines.
- Never edit generated migrations; change `packages/db/schema` and run `bun run db:generate`.
- Run `bun run check:fix`; the `soonlist/*` rules in `tooling/oxlint-plugins` enforce the remaining style.

## Skills

`domain-model` (boundaries, glossary in `UBIQUITOUS_LANGUAGE.md`), `adr-authoring` (`docs/decisions`), `impeccable` (UI and design), `pull-request`.
