# Soonlist agent rules

Personal Todoist-like task list for one owner, Upcoming-first. Stack: Turborepo + Bun workspaces, TanStack Start (React 19, Router, Query), Effect 4, oRPC v2, Tailwind 4 with shared tokens and `@soonlist/ui` primitives, oxlint/oxfmt via ultracite, Vitest, commitlint + husky. Deployed on Vercel.

## Security

- Never read `.env` files or print secrets; `.env.example` is fine. Running `bun --env-file=apps/web/.env.local ...` is fine.

## Product And Design

- Product strategy and scope live in `PRODUCT.md` (decisions are final).
- The visual system lives in `DESIGN.md` (Todoist dark theme for now); machine-readable design guidance in `.impeccable/design.json`; tokens in `tooling/tailwind-config/tokens.css`.
- For UI design, redesign, polish, audit or craft, use `impeccable`. Keep `DESIGN.md`, the sidecar and the tokens in sync.

## Sources of truth

- Layout and boundaries: `ARCHITECTURE.md`. Architecture decisions: `docs/decisions/`. Domain terms: `UBIQUITOUS_LANGUAGE.md`. Deploy: `docs/deploy-vercel.md`.

## Before Editing

- Before creating or editing any file, read matching skill(s), at least 3 similar files, and uncertain imported dependency implementations or types.
- Live repo patterns beat examples and assumptions.
- Similar-file review never replaces skill usage.

## Skill Usage

- If a task matches a skill in `.agents/skills` (also `.claude/skills`), read it before research, planning, creating, or editing files.
- App and package rules live next to the code and load automatically, each with a `CLAUDE.md` symlink: `apps/web/AGENTS.md`, `packages/ui/AGENTS.md`, `packages/contracts/AGENTS.md`.
- Code skills: `domain-model` (Effect ports, layers, package boundaries), `zod-schemas`, `utils-helpers`, `no-use-effect`, `impeccable` (UI and design craft), `patch-package`.
- Workflow skills: `conventional-commit`, `pull-request`, `watch-pr-reviews`, `fix-review-findings`, `investigate-issue`, `health-sweep`, `api-manual-testing` (curl against `/api/rpc`), `handoff`.
- Docs skills: `adr-authoring`, `ubiquitous-language`, `self-improve`, `write-a-skill`.

## Layout

- `apps/web/src/platform`: config, app runtime and layers, oRPC wiring (`rpc.base.ts`, `rpc.context.ts`, `rpc.router.ts`, `rpc.handler.ts`), the `system` router.
- `apps/web/src/modules/<module>/{domain,application,infrastructure,presentation}`: `tasks` (calendar logic, Upcoming and Today views).
- `apps/web/src/lib/orpc`: browser and SSR oRPC clients, TanStack Query utils. `apps/web/src/components/app-shell`: the sidebar shell composed from `@soonlist/ui`.
- `packages/domain` (`@soonlist/domain`): brands such as `CalendarDate` and shared constants.
- `packages/contracts` (`@soonlist/contracts`): the oRPC contract and Zod schemas; the only API boundary.
- `packages/ui` (`@soonlist/ui`): reusable React primitives (`button`, `skeleton`, `avatar`, `sidebar`) and `cn`.
- `tooling/typescript-config` (tsconfig presets `base`, `react-library`, `react-app`), `tooling/tailwind-config` (Tailwind 4 theme and tokens), `tooling/oxlint-plugins` (`soonlist/*` lint rules).

## Package Layering

- Dependencies point one way: `apps/web` → `contracts` / `ui` → `domain`. `ui` and `contracts` never import each other or any app; `domain` imports nothing from the workspace.
- `packages/contracts`, `packages/domain` and `packages/ui` are browser-safe: no Effect services, no Node built-ins, no server code.
- Code moves from `apps/web` into a package only when a second consumer needs it (the desktop app, another package); see ADR 0002.
- Every workspace extends a `@soonlist/typescript-config` preset and declares every workspace package it imports in its `package.json` (Bun's isolated linker fails the build otherwise).

## Effect Layering

- Pure `domain/` never imports the framework, ORM, RPC or Effect services; it holds types, tagged errors and pure helpers.
- `application/` holds ports (`*.port.ts`: `Context.Service` without implementation) and services (`*.service.ts`: `Context.Service` + `*Live` layer per use-case group, methods via `Effect.fn('Service.method')`).
- `infrastructure/` implements ports: `*.repository.ts` over Drizzle, `*.layer.ts` for external adapters, `*.parser.ts` for external HTML/JSON, `*.client.ts` for one external API.
- `presentation/` holds routers, raw HTTP handlers, middleware, components, hooks and helpers.
- `platform/app.layers.ts` composes every `*Live` layer; `platform/app.runtime.ts` owns the single `ManagedRuntime`.
- Errors are `Data.TaggedError` with a `code` field and map to oRPC errors only in `platform/rpc/rpc.base.ts`. Repositories run every query through `Db.run`, which owns the `DbError` translation, and never catch, recover or translate errors. (enforced by `soonlist/no-repository-try-catch`)

## Server Boundary

- Server-only code (`platform/`, `application/`, `infrastructure/`, `*.router.ts`, `*.handler.ts`, `*.port.ts`, `*.service.ts`, `*.repository.ts`, `*.layer.ts`, `*.middleware.ts`, `routes/api.*`, `*.server.*`) must never reach the client bundle. TanStack Start import protection in `apps/web/vite.config.ts` fails the build when it does.
- Browser-reachable code (components, hooks, presentation helpers, `lib/`) imports only `domain/`, packages and other browser-reachable code; it reaches the server through oRPC.
- Isomorphic code splits per environment: `lib/orpc/rpc.client.ts` wires the browser `RPCLink` and the in-process SSR client from `rpc.client.server.ts` with `createIsomorphicFn`.
- After touching imports across that line, run `bun run build` and grep `apps/web/.vercel/output/static/assets` for `drizzle`, `pg`, `effect/` and service names.

## File Naming

- Every `.ts` file under `apps/web/src` and `packages/*` is `<kebab-name>.<role>.ts`: the folder says where it lives, the suffix says what it is, and both hold even in an unusual folder. (enforced by `soonlist/file-role-suffix`; folder placement warned by `soonlist/file-role-folder`)
- Exceptions: React components (bare kebab-case `.tsx`, PascalCase export; `*.skeleton.tsx` for skeletons), hooks (`use-*.ts`), package `index.ts` barrels, generated files (`routeTree.gen.ts`), `*.route.ts(x)`, framework entries (`src/router.tsx`, `src/routes.ts`), specs, `scripts/**` and `tests/**`.

| Suffix                                        | Role                                                                  | Folder                                                             |
| --------------------------------------------- | --------------------------------------------------------------------- | ------------------------------------------------------------------ |
| `.service.ts`                                 | Effect `Context.Service` + `*Live` layer, one per use-case group      | `application/`                                                     |
| `.port.ts`                                    | port (`Context.Service` without implementation)                       | `application/`                                                     |
| `.repository.ts`                              | port implementation over Drizzle                                      | `infrastructure/`                                                  |
| `.layer.ts`                                   | external adapter exposed as a Layer (auth, HTTP clients, models, db)  | `infrastructure/`, `platform/`                                     |
| `.parser.ts`                                  | pure parsing of external HTML/JSON into readings                      | `infrastructure/`                                                  |
| `.client.ts`                                  | HTTP client for one external API; browser clients (Better Auth, oRPC) | `infrastructure/`, `presentation/`, `lib/`                         |
| `.router.ts`, `.handler.ts`, `.middleware.ts` | RPC router, raw HTTP handler, oRPC middleware                         | `presentation/`, `platform/`                                       |
| `.base.ts`, `.context.ts`                     | oRPC implementer with the error middleware, RPC context               | `platform/rpc/`                                                    |
| `.errors.ts`                                  | `Data.TaggedError` classes, contract error maps                       | `domain/`, `platform/`, `packages/contracts`                       |
| `.types.ts`                                   | interfaces, brands, type-only files                                   | anywhere                                                           |
| `.constants.ts`                               | module-level constants, limits, messages                              | anywhere                                                           |
| `.helper.ts`                                  | pure module-specific function(s)                                      | `domain/`, `presentation/helpers/`, `infrastructure/`, `platform/` |
| `.util.ts`                                    | pure global, domain-agnostic function                                 | `src/utils/` of an app or package (`cn` lives in `packages/ui`)    |
| `.schema.ts`                                  | Drizzle table                                                         | `packages/db/schema/`                                              |
| `.contract.ts`, `.schemas.ts`                 | oRPC contract, shared Zod schemas                                     | `packages/contracts/src/`                                          |
| `.mock.ts`                                    | test fixtures, never collected by Vitest                              | beside the source or `tests/support/`                              |
| `.fixture.html`, `.fixture.json`              | saved external pages for parser specs                                 | `infrastructure/fixtures/`                                         |
| `.runtime.ts`, `.layers.ts`, `.config.ts`     | app runtime, composed layers, config                                  | `platform/`                                                        |
| `.server.ts` (modifier)                       | server half of an isomorphic file, e.g. `rpc.client.server.ts`        | beside its client half                                             |
| `.rule.mts`, `.plugin.mts`, `.helper.mts`     | lint plugin files                                                     | `tooling/oxlint-plugins/`                                          |

- Group a module's components into role folders once three or more share a role (`list/`, `upcoming/`). `hooks/` holds only `use-*.ts(x)` hooks and their specs; cache and query helpers live in `helpers/`. (enforced by `soonlist/hooks-dir-only-hooks`)

## Code Style

- Implementation files stay under 400 lines; split by component or role before they grow past that. Spec files have no length limit. (enforced by `max-lines`)
- Kebab-case file names; no barrel files in `apps/web`; a package has at most one barrel, its root `index.ts`, and other `exports` entries point at concrete files (`packages/ui` has no barrel). (enforced by `oxc/no-barrel-file`)
- Use app aliases and package imports; avoid cross-workspace relative imports. (enforced by `no-restricted-imports`)
- Prefer `function` declarations for block-body functions; arrows for callbacks and concise expression helpers.
- Interfaces for object shapes, declared directly above their use; type aliases for unions, primitives and computed types. Never inline object param types in signatures.
- Every module-level constant object is declared with `as const satisfies <Type>`; config maps of literal values use `UPPER_SNAKE_CASE`.
- Consecutive single-line module-level CONSTANTS (`const` whose every binding is UPPER_SNAKE_CASE) stay together without blank lines; camelCase/PascalCase consts and destructuring are never forced together, a multi-line declaration ends the group, and an own-line comment is a deliberate separator. (enforced by `soonlist/declaration-group-spacing`)
- Declare each type inferred from a Drizzle table or Zod schema directly under that declaration, never grouped at the end of the file or after `relations(...)`; several types of one source follow it consecutively. (enforced by `soonlist/inferred-type-placement`)
- Prefix generic type parameter names with `T`; use descriptive names when intent is domain-specific, e.g. `TOperationResult`. (enforced by `soonlist/type-param-prefix`, which also covers `infer` bindings and mapped type keys)
- Declare `children` by extending `PropsWithChildren` from `react`, never `children: ReactNode` in props. (enforced by `soonlist/props-with-children`)
- Hooks take the `Query`/`Queries` suffix only when they just build and return TanStack Query object(s) (`useRoastQuery`; `*Queries` for several, `*InfiniteQuery` for infinite); hooks that derive or combine state have none (`useLibraryTracks`). File names mirror the hook (`use-roast-query.ts`). (enforced by `soonlist/hook-query-naming`)
- Utils are global and domain-agnostic; helpers are module-specific and domain-aware.
- Use `to*` names only for transformations; use `get*` for message or label selection.
- Prefer `undefined` at API boundaries; `null` only where persistence or an external contract requires it. `??` for nullish checks, `||` for intentional all-falsy checks.
- Early returns; skip braces for single-statement blocks; no non-null assertions. (enforced by `typescript/no-non-null-assertion`)
- No comments unless the why cannot be inferred; no JSDoc restating signatures.
- No trivial one-use wrappers, no "for later" layers, no defensive coercion of already-typed data. Parse only at real boundaries (HTTP input, env, external HTML/JSON, DB JSON) with Zod.
- Catch only to add context or translate provider and database errors, in services, handlers and `Db.run`.
- Use `size-*` instead of paired height/width utilities; prefer Tailwind scale units over arbitrary values.
- UI copy in English, no em dashes.
- "Today" is the user's local calendar day: compute it in the browser (`useToday`), pass it as a `CalendarDate`, and never derive it from the server clock.

## Testing

- Vitest globals are enabled; do not import `test`, `describe`, `vi` or `expect`. Use `test`, not `it`. (enforced by `vitest/consistent-test-it`)
- One spec per source file: `foo.helper.spec.ts` sits beside `foo.helper.ts`, `upcoming-page.spec.tsx` beside `upcoming-page.tsx`. Cross-file flows are integration specs in `apps/web/tests/integration/<flow>.integration.spec.ts` with shared support in `apps/web/tests/support`. (enforced by `soonlist/spec-file-pairing`)
- Put imports first, then `vi.mock`. Define module mocks inline in the `vi.mock` factory and assert through imported mocked symbols with `vi.mocked`. Do not use `vi.hoisted`. (enforced by `vitest/no-restricted-vi-methods`)
- Reuse shared mocks (`*.mock.ts`) and factories before adding duplicate IDs, dates, users or payloads.
- Do not use `.resolves` for successful async assertions; use `expect(await promise)`. Use `.rejects` for expected async errors and never `try/catch` expected test errors. (enforced by `vitest/no-restricted-matchers`)

## Zod

- Use Zod v4 top-level validators like `z.url()`, `z.email()` and `z.uuid()`.
- Use `.optional()` instead of `.nullable()` in contract schemas; `.nullable()`/`.nullish()` only for external data that returns `null`.
- Use `z.coerce.number()` and `z.coerce.date()` for GET query and search params.

## Frontend Data

- No `useEffect` and no `useSuspenseQuery`. (enforced by `no-restricted-imports`)
- Use `useQuery`/`useMutation` with `queryOptions()`/`mutationOptions()` and explicit loading, error, empty and success states.
- Pass all options inside `queryOptions()`.

## Quality

- Visible UI changes need desktop (1280px) and mobile (390px) screenshots before completion.
- Run relevant checks before finishing: `bun run typecheck`, `bun run check:fix`, `bun run test`; `bun run build` when imports cross the server boundary.

## Commands

`bun run dev` (port 3000), `bun run typecheck`, `bun run check` / `check:fix`, `bun run test`, `bun run build`, `bun run commit` (commitizen).

## Git

- Conventional commits, checked by `commitlint` in the `commit-msg` hook and in CI; `pre-commit` runs `lint-staged` (`ultracite fix` on staged files). Never bypass hooks with `--no-verify`.
- Use `conventional-commit` for commits and `pull-request` for PRs; dependent PRs form a native GitHub stack.

## Forbidden

- Reading `.env` files or printing secrets; `.env.example` is fine.
- Destructive git (`reset`, `checkout --`, `restore`, `stash`, `clean`), commits, pushes or deploys unless asked. Commit only when the user asks.
- AI attribution in commits, PRs, code or docs (no `Co-Authored-By`, no "Generated with").
- Auth bypasses or test-login routes.
- Network configuration changes.
