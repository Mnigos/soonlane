# Architecture

Map of the Soonlist monorepo: what lives where, which module owns what, and how the pieces talk. Domain vocabulary lives in [UBIQUITOUS_LANGUAGE.md](UBIQUITOUS_LANGUAGE.md); hard-to-reverse decisions live in [docs/decisions](docs/decisions).

A Turborepo + Bun monorepo. One TanStack Start app serves the UI, SSR and the API; the API at `/api/rpc` is the same one a future desktop app will call.

## Monorepo layout

| Path                     | What it is                                                                                                            |
| ------------------------ | --------------------------------------------------------------------------------------------------------------------- |
| `apps/web`               | TanStack Start app: UI, SSR and `/api/rpc`. Routes under `src/routes` and `src/modules/[module]/presentation/routes`. |
| `apps/web/tests/support` | Test support: `rpc-context.mock`.                                                                                     |
| `packages/domain`        | `Brand` and `CalendarDate` (`*.types.ts`, `*.constants.ts`).                                                          |
| `packages/contracts`     | oRPC contract and Zod schemas (`*.contract.ts`, `*.schemas.ts`). The API boundary shared by server and browser.       |
| `tooling/oxlint-plugins` | `soonlist/*` lint rules: file names, spec pairing, `hooks/`, repositories and style.                                  |

Inside `apps/web/src`:

| Path                      | What it is                                                                                                                                                                                                |
| ------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `router.tsx`, `routes.ts` | Router and the virtual route config (TanStack Router).                                                                                                                                                    |
| `routes/`                 | `__root`, `app-layout` (pathless layout with the sidebar shell), `/api/rpc/$`.                                                                                                                            |
| `platform/`               | Server only: `config/(app.config, app-url.helper)`, `app.layers`, `app.runtime` (`ManagedRuntime`), `rpc/(rpc.base, rpc.context, rpc.router, rpc.handler, error-mapping.helper)`, `system/system.router`. |
| `modules/`                | `tasks`; see [Modules](#modules).                                                                                                                                                                         |
| `lib/orpc/`               | `rpc.client` (browser and SSR through `createIsomorphicFn`), `rpc.client.server` (in-process SSR client), `rpc-query.client`, constants.                                                                  |
| `utils/`                  | `cn.util`.                                                                                                                                                                                                |
| `components/`             | `ui/` (`button`, `skeleton`), `app-shell/` (sidebar, nav, shell state), `not-found`.                                                                                                                      |

## Request flow

```
browser (orpcQuery + TanStack Query) or SSR loader
  → contract (packages/contracts, Zod input/output)
    → /api/rpc: createRpcHandler (Origin check, context, RPCHandler)
      → router procedure (presentation/*.router.ts or platform/system)
        → service (application/*.service.ts, Effect)
          → port → adapter (infrastructure)
```

A request to `/api/rpc` goes through `createRpcHandler`: it rejects a foreign `Origin` (anything other than the request origin and `AppConfig.trustedOrigins`), builds the context (services from the `ManagedRuntime`), and `RPCHandler` runs the Effect procedures. Only `POST` reaches procedures, so a plain link cannot trigger one.

SSR calls procedures in process (`rpc.client.server.ts`, `createRouterClient` with the current request's headers); the browser goes over `RPCLink` to `/api/rpc`. Both use the same contract.

`system.health` returns `{ ok, version }`, where `version` is `VERCEL_GIT_COMMIT_SHA` (or `dev` locally). It proves the oRPC → Effect runtime path end to end.

### Dates and "today"

A day is a `CalendarDate` (`YYYY-MM-DD`, branded in `packages/domain`). The server cannot know the user's time zone, so "today" is read in the browser: `useToday()` (`useSyncExternalStore`) returns `undefined` during SSR and hydration, then the local date, and re-reads it at local midnight and when the tab becomes visible. Pages render a skeleton until the date is known. Calendar arithmetic and labels (`calendar-date.helper`, `day-label.helper`, `upcoming-view.helper`) are pure functions on UTC midnights, so they never cross a DST shift. Procedures that need "today" will take it as input from the client.

### Upcoming view

`/` shows the selected week (`?week=YYYY-MM-DD`, any day of the week; a past week falls back to the current one). The current week lists 14 days from today and shows the Overdue section; a later week lists 14 days from its Monday without it. The week strip greys out past days and links the others to their day section.

## Modules

Each module under `apps/web/src/modules` follows the same layering; a module only has the layers it needs.

| Module  | Domain                                                                                   | Application | Infrastructure | Presentation                                                                            |
| ------- | ---------------------------------------------------------------------------------------- | ----------- | -------------- | --------------------------------------------------------------------------------------- |
| `tasks` | `calendar-date.helper`, `day-label.helper`, `upcoming-view.helper`, `calendar.constants` | none yet    | none yet       | `/` (Upcoming), `/today`, `components/{list,upcoming}`, `today-page`, `hooks/use-today` |

## Cross-module rules

### Effect layering

Dependencies point inward: presentation → application → domain. Infrastructure implements the ports declared in application, and `platform/app.layers.ts` composes every `*Live` layer into `AppLive`. The domain never imports the framework, the ORM or RPC.

### Error mapping

Domain errors (`Data.TaggedError` with a `code` field) become oRPC errors in one middleware in `platform/rpc/rpc.base.ts`.

### Server boundary

Server-only code (`platform/`, `application/`, `infrastructure/`, `*.router.ts`, `*.handler.ts`, `*.port.ts`, `*.service.ts`, `*.repository.ts`, `*.layer.ts`, `*.middleware.ts`, `*.server.*` files and `routes/api.*` routes) must never reach the browser bundle. TanStack Start import protection in `apps/web/vite.config.ts` (`behavior: 'error'`) enforces it: the build fails when such a module survives in the client bundle. The default server rule for `**/*.client.*` is disabled, because `.client.ts` here means an HTTP client, not a browser-only module.

`lib/orpc/rpc.client.ts` joins two clients through `createIsomorphicFn`: in the browser an `RPCLink` to `/api/rpc`, in SSR `createRouterClient` from `rpc.client.server.ts`, which calls procedures in process with the current request's headers. The compiler removes the server branch together with its import, so the client build never resolves the `.server.ts` file. Post-build check: `apps/web/.vercel/output/static/assets` contains no `effect/` runtime, no `ManagedRuntime` and no service names.

### File names

Every `.ts` file in `apps/web/src` and `packages/*` is `<kebab-name>.<role>.ts`: the folder says where the file lives, the suffix says what it is. Exceptions: React components (`day-section.tsx`, skeletons `*.skeleton.tsx`), hooks (`use-*.ts`), package `index.ts` barrels, generated files, `*.route.ts(x)`, framework entries (`router.tsx`, `routes.ts`), specs, `scripts/**` and `tests/**`. The full suffix and folder table is in `AGENTS.md`; the rules `soonlist/file-role-suffix` (error) and `soonlist/file-role-folder` (warning) enforce it. The `hooks/` folder holds only `use-*.ts(x)` (`soonlist/hooks-dir-only-hooks`).

Every spec `*.spec.ts(x)` sits beside the file with the same base name (`soonlist/spec-file-pairing`).

## Deployment

Vercel project `soonlist` (Root Directory `apps/web`), Nitro preset `vercel`, one Node 22 function in `fra1` next to the Neon database in `eu-central-1`. Details: [docs/deploy-vercel.md](docs/deploy-vercel.md).

## Decision records

| ADR                                                            | Decision                                                                                    |
| -------------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| [0001](docs/decisions/0001-naming-and-layering-conventions.md) | Role-suffixed file names, `src/platform`, Effect layering and the enforced server boundary. |

## Related docs

- [PRODUCT.md](PRODUCT.md): scope and design direction.
- [UBIQUITOUS_LANGUAGE.md](UBIQUITOUS_LANGUAGE.md): domain terms and UI labels.
- [docs/deploy-vercel.md](docs/deploy-vercel.md): Vercel and Neon setup.
- `AGENTS.md`, `apps/web/AGENTS.md` and `.agents/skills`: working rules for agents.
