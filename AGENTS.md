# Soonlane agent rules

Todoist-like personal task list: anyone can sign up with Google and gets their own tasks. Bun + Turborepo; TanStack Start (React 19, Router, Query) as a Bun server on Railway; the API (`apps/api`, Bun + Effect 4) on Railway; oRPC v2; Drizzle on Neon Postgres; Better Auth (Google, open sign-up); Tailwind 4; oxlint/oxfmt via Ultracite. Map: `ARCHITECTURE.md`. Product and look: `PRODUCT.md`, `DESIGN.md`.

## Must

- Never read `.env` files or print secrets.
- Commit only when asked. Conventional commits (commitlint runs in the hook and CI); never `--no-verify`. No AI attribution anywhere: no `Co-Authored-By`, no "Generated with".
- Product scopes (`tasks`, `labels`, `projects`, `shell`, `desktop`, `mobile`, `identity`, `site`, `blog`, `changelog`, `consent`) on `feat`/`fix`/`perf` mark a change a user notices, and only those reach the list of changes in `CHANGELOG.md`; write the subject as a plain sentence a user can read. The release summary tells the story of a feature, so one subject need not explain it alone.
- Internal work in those areas uses `refactor`/`chore`/`build`/`ci`, or an infra scope (`auth`, `db`, `ui`, `web`, `release`, `analytics`, ...).
- Never edit `CHANGELOG.md` or `version.json` in a feature PR; only the release PR the `release` skill prepares writes them (`docs/release.md`).
- No unit tests and no test frameworks. The gates are `bun run check`, `bun run typecheck` and `bun run build`.
- "Today" is the user's local day, read on their device (`useToday` in the browser). Never derive it from the server clock.

## Boundaries

- Packages: `domain` (brands with their Zod schemas and pure domain logic both apps run; no workspace deps, `zod` only in the brand schema files) ← `contracts` (the only API boundary, oRPC + Zod) and `ui` (app-agnostic primitives: no router, data fetching or domain types); `domain` ← `db` (Drizzle schema, migrations; server-only) ← `auth` (`createAuth` at `/server`, server-only; browser client at `/client`; sign-up policy and the signed-in hint cookie at the root); `app` (`@soonlane/app`: screens both host apps render, on `ui`, `domain`, `contracts`, `analytics`, TanStack Query and Router; never Effect, TanStack Start or server code; each host app provides its oRPC link with `provideRpcLink`, its toasts, analytics and resume signal with `provideHostPorts`, and what only it knows through `HostAppContext`; links go through `APP_PATHS`; the planned Expo app in `apps/mobile` will use only its DOM-free hooks and helpers, ADR 0017). Packages never import an app and never use Effect; the API wraps them in layers.
- `apps/api/src/modules/<module>/` (server) and `apps/web/src/modules/<module>/` (UI): `domain/` is pure (no Effect services, framework, ORM or RPC); `application/` holds services (`Context.Service`, `*Live` layer, `Effect.fn('Service.method')`) and ports for outside systems the app may replace (`Analytics`, `Auth`); `infrastructure/` implements those ports and holds repositories, each declaring its tag and `*RepositoryLive` layer in one `<entity>.repository.ts` that services import (queries run through `Db.run` and never catch; ADR 0014); `presentation/` holds routers, middleware, components, hooks, routes.
- `apps/desktop/src/` uses the same `platform/` and `modules/<module>/{domain,application,infrastructure}` split; Electrobun is imported only in `infrastructure/`, `platform/electrobun/` and `main.ts`.
- `apps/api/src/platform/`: config, `AppLive`, the single `ManagedRuntime`, the HTTP entry (client IP), oRPC wiring. Tagged errors (`Data.TaggedError` with `code`) become oRPC errors only in `platform/rpc/rpc.base.ts`. Only the API reaches the database and Better Auth's server.
- `apps/web/src/platform/`: the oRPC client (the browser calls the API host, SSR adds the visitor headers); no Effect runtime. The web app never imports `@soonlane/db`, `@soonlane/auth/server`, `pg`, `drizzle-orm` or `effect`.
- Web server-only: `platform/`, `infrastructure/`, `*.handler.ts`, `*.server.*`, `routes/api.*`. The client may import only the three browser-safe oRPC files in `platform/rpc` (`rpc.client.ts`, `rpc-prefix.constants.ts`, `rpc-serializer.constants.ts`). Import protection fails the build otherwise.

## Code

- File names: `<kebab-name>.<role>.ts` with a role from `base, client, config, constants, context, contract, errors, handler, helper, layer, layers, mapper, middleware, parser, port, query, repository, router, runtime, schema, schemas, service, types, util` (optional `.server` modifier). A file that belongs to another carries both roles, the kind last: `task.repository.types.ts`; each role's folder rule applies. Components are bare kebab-case `.tsx`, hooks `use-*.ts`, routes `*.route.ts(x)`. `*.query.ts` (a Drizzle query or query piece repositories share) and `*.mapper.ts` (a row to contract type mapping) live only in `infrastructure/`. (lint-enforced)
- No barrel files, except one root `index.ts` per package (`packages/ui` has none; import through its export map).
- No `export default`; every export is named. The only exceptions are files a tool loads through their default export, listed in the `import/no-default-export` override in `oxlint.config.mts`. (lint-enforced)
- One import statement per module. Only types from it: `import type { A } from 'x'`; types and values: `type` inside the braces (`import { Config, type Redacted } from 'effect'`), never a second `import type` line. (lint-enforced)
- Module names: plural for a collection of entities (`tasks`, `labels`), singular for a concept (`identity`, `shell`, `analytics`). The module name is reused as is for the service, router, contract, oRPC procedure namespace and URL segment (`TasksService`, `tasks.router.ts`, `tasks.list`, `/app/labels/$name`). Anything about one entity is singular: type (`Task`), DB table (`task`), repository and its file (`TaskRepository`, `task.repository.ts`), errors (`task.errors.ts`), ids (`TaskId`), analytics events (`task_created`). (lint-enforced for services, routers and contracts)
- No `useEffect`, no `useSuspenseQuery` and no bare TanStack `mutationOptions`; pass options straight to `useQuery`/`useMutation`, or use `orpcQuery`'s `queryOptions()`/`mutationOptions()` for procedures. (lint-enforced)
- Runtime only in the file suffix (`.server.ts`), never in identifiers.
- Ids (`TaskId`, `LabelId`, `UserId`) and `CalendarDate` are each defined once in `packages/domain` as a Zod schema with `.brand()` and the type inferred from it (`user-id.schema.ts`: `userIdSchema`, `UserId`); contracts compose API inputs and outputs from these schemas and Drizzle brands rows with `$type`, so code receives branded values and never brands a string. Nothing casts to a brand type, not even inside a `.transform()`, except the private `fromUtcDate` in `packages/domain/src/dates/calendar-date.helper.ts`, through which every computed date passes; elsewhere parse with the domain schema (`userIdSchema.parse`, `storedCalendarDateSchema.parse`). (lint-enforced)
- Task queries go through `ownedTasks(database, ownerId)` in `apps/api/src/modules/tasks/infrastructure/owned-tasks.query.ts`, so none can leave out the owner filter; only that file reads `task.ownerId`. (lint-enforced) Four single statements query the table themselves (`task-update.query.ts`, `task-progress.query.ts`, `label.repository.ts`, `project.repository.ts`, the rule's allowlist) and take `ownedBy(ownerId)` from that file; lint does not check their condition, so review does.
- No `let` inside functions: use `const` and move the use into the block that assigns the value, return early, or extract a function. Module-level state and loop heads may use `let`. (lint-enforced)
- Secrets (names with `SECRET`, `PASSWORD`, `TOKEN`, `KEY`, or starting with `DATABASE_URL`) are read with `Config.Redacted` and unwrapped with `Redacted.value` only where the client that needs them is built. (lint-enforced)
- Effects run through the app runtime: `runtime.run*` at a framework edge, `Effect.run*With(context)` with a context captured inside a layer; `Effect.runSync`/`runPromise`/`runFork` only in the `main.ts` entry points. (lint-enforced)
- Implementation files stay under 400 lines.
- JSDoc (`/** … */`) on a declaration (exported or module-level function, component, hook, type, constant) is welcome when it says what the thing is for, its contract, or a non-obvious why. Keep it short; don't restate the name.
- A comment directly above a module-level declaration is JSDoc, never `//`. (lint-enforced)
- `//` comments inside function bodies are the exception: only for a quirk or constraint the reader would otherwise "fix" wrongly. Prefer moving that why into the declaration's JSDoc.
- No comment narrates history ("previously", "now") or explains React, TanStack or Effect basics.
- Consecutive single-line module-level `const` declarations stay together without blank lines. (lint-enforced)
- Never edit generated migrations; change `packages/db/schema` and run `bun run db:generate`.
- Run `bun run check:fix`; the `soonlane/*` rules in `tooling/oxlint-plugin` enforce the remaining style.

## Skills

`domain-model` (boundaries, glossary in `UBIQUITOUS_LANGUAGE.md`), `adr-authoring` (`docs/decisions`), `impeccable` (UI and design), `pull-request`, `pr-risk` (risk labels on PRs), `release` (the stable release PR).
