# Soonlane agent rules

Todoist-like personal task list: anyone can sign up with Google and gets their own tasks. Bun + Turborepo; TanStack Start (React 19, Router, Query) on Vercel; Effect 4 on the server; oRPC v2; Drizzle on Neon Postgres; Better Auth (Google, open sign-up); Tailwind 4; oxlint/oxfmt via Ultracite. Map: `ARCHITECTURE.md`. Product and look: `PRODUCT.md`, `DESIGN.md`.

## Must

- Never read `.env` files or print secrets.
- Commit only when asked. Conventional commits (commitlint runs in the hook and CI); never `--no-verify`. No AI attribution anywhere: no `Co-Authored-By`, no "Generated with".
- Product scopes (`tasks`, `labels`, `shell`, `desktop`, `identity`, `site`, `blog`, `changelog`, `consent`) on `feat`/`fix`/`perf` mark a change a user notices, and only those reach `CHANGELOG.md`; write the subject as a user-facing sentence, since it is the changelog entry.
- Internal work in those areas uses `refactor`/`chore`/`build`/`ci`, or an infra scope (`auth`, `db`, `ui`, `web`, `release`, `analytics`, ...).
- Never edit `version.json` or the lists of changes in `CHANGELOG.md` in a PR; only the release workflow writes them. The one hand edit to `CHANGELOG.md` is the summary at the top of a released section, made in its own PR or a release PR (`docs/release.md`).
- No unit tests and no test frameworks. The gates are `bun run check`, `bun run typecheck` and `bun run build`.
- "Today" is the user's local day, read in the browser (`useToday`). Never derive it from the server clock.

## Boundaries

- Packages: `domain` (brands, no workspace deps) ← `contracts` (the only API boundary, oRPC + Zod) and `ui` (app-agnostic primitives: no router, data fetching or domain types); `domain` ← `db` (Drizzle schema, migrations; server-only) ← `auth` (`createAuth` at `/server`, server-only; browser client at `/client`; sign-up policy and the signed-in hint cookie at the root). Packages never import an app and never use Effect; the web app wraps them in layers.
- `apps/web/src/modules/<module>/`: `domain/` is pure (no Effect services, framework, ORM or RPC); `application/` holds ports and services (`Context.Service`, `*Live` layer, `Effect.fn('Service.method')`); `infrastructure/` implements ports (repositories run queries through `Db.run` and never catch); `presentation/` holds routers, middleware, components, hooks, routes.
- `apps/desktop/src/` uses the same `platform/` and `modules/<module>/{domain,application,infrastructure}` split; Electrobun is imported only in `infrastructure/`, `platform/electrobun/` and `main.ts`.
- `apps/web/src/platform/`: config, `AppLive`, the single `ManagedRuntime`, oRPC wiring. Tagged errors (`Data.TaggedError` with `code`) become oRPC errors only in `platform/rpc/rpc.base.ts`.
- Server-only: `platform/`, `application/`, `infrastructure/`, `*.router|handler|port|service|repository|layer|middleware.ts`, `*.server.*`, `routes/api.*`, and the specifiers `@soonlane/auth/server`, `@soonlane/db`, `pg`, `drizzle-orm`. The client may import only the four browser-safe oRPC files in `platform/rpc` (`rpc.client.ts`, `rpc-query.client.ts`, `rpc-prefix.constants.ts`, `rpc-serializer.constants.ts`). Import protection fails the build otherwise.

## Code

- File names: `<kebab-name>.<role>.ts` with a role from `base, client, config, constants, context, contract, errors, handler, helper, layer, layers, middleware, parser, port, repository, router, runtime, schema, schemas, service, types, util` (optional `.server` modifier). Components are bare kebab-case `.tsx`, hooks `use-*.ts`, routes `*.route.ts(x)`. (lint-enforced)
- No barrel files, except one root `index.ts` per package (`packages/ui` has none; import through its export map).
- Module names: plural for a collection of entities (`tasks`, `labels`), singular for a concept (`identity`, `shell`, `analytics`). The module name is reused as is for the service, router, contract, oRPC procedure namespace and URL segment (`TasksService`, `tasks.router.ts`, `tasks.list`, `/app/labels/$name`). Anything about one entity is singular: type (`Task`), DB table (`task`), repository port and file (`TaskRepository`, `task.repository.ts`), errors (`task.errors.ts`), ids (`TaskId`), analytics events (`task_created`). (lint-enforced for services, routers and contracts)
- No `useEffect`, no `useSuspenseQuery` and no bare TanStack `mutationOptions`; pass options straight to `useQuery`/`useMutation`, or use `orpcQuery`'s `queryOptions()`/`mutationOptions()` for procedures. (lint-enforced)
- Runtime only in the file suffix (`.server.ts`), never in identifiers.
- Ids (`TaskId`, `LabelId`, `UserId`) and `CalendarDate` arrive branded from the contract schemas and Drizzle `$type`; app code never brands a string. Only the contract schemas, date arithmetic in `tasks/domain`, the changelog parser and the Better Auth layer call the `to*` constructors from `@soonlane/domain`. (lint-enforced)
- No `let` inside functions: use `const` and move the use into the block that assigns the value, return early, or extract a function. Module-level state and loop heads may use `let`. (lint-enforced)
- Implementation files stay under 400 lines.
- JSDoc (`/** … */`) on a declaration (exported or module-level function, component, hook, type, constant) is welcome when it says what the thing is for, its contract, or a non-obvious why. Keep it short; don't restate the name.
- A comment directly above a module-level declaration is JSDoc, never `//`. (lint-enforced)
- `//` comments inside function bodies are the exception: only for a quirk or constraint the reader would otherwise "fix" wrongly. Prefer moving that why into the declaration's JSDoc.
- No comment narrates history ("previously", "now") or explains React, TanStack or Effect basics.
- Consecutive single-line module-level `const` declarations stay together without blank lines. (lint-enforced)
- Never edit generated migrations; change `packages/db/schema` and run `bun run db:generate`.
- Run `bun run check:fix`; the `soonlane/*` rules in `tooling/oxlint-plugins` enforce the remaining style.

## Skills

`domain-model` (boundaries, glossary in `UBIQUITOUS_LANGUAGE.md`), `adr-authoring` (`docs/decisions`), `impeccable` (UI and design), `pull-request`.
