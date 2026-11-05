# Architecture

A Turborepo + Bun monorepo. One TanStack Start app serves the UI, SSR and the oRPC API at `/api/rpc`, which a future desktop app will call too. Terms: [UBIQUITOUS_LANGUAGE.md](UBIQUITOUS_LANGUAGE.md). Decisions: [docs/decisions](docs/decisions).

## Layout

| Path                        | What it is                                                                                          |
| --------------------------- | --------------------------------------------------------------------------------------------------- |
| `apps/web`                  | TanStack Start app on Vercel (Nitro `vercel` preset, Node 22, `fra1`).                              |
| `packages/domain`           | `@soonlist/domain`: brands (`CalendarDate`) and shared constants.                                   |
| `packages/contracts`        | `@soonlist/contracts`: the oRPC contract and Zod schemas.                                           |
| `packages/ui`               | `@soonlist/ui`: app-agnostic React primitives (`button`, `skeleton`, `avatar`, `sidebar`) and `cn`. |
| `tooling/typescript-config` | tsconfig presets: `base`, `react-library`, `react-app`.                                             |
| `tooling/tailwind-config`   | Tailwind 4 theme and the tokens described in `DESIGN.md`.                                           |
| `tooling/oxlint-plugins`    | `soonlist/*` lint rules: file names, hooks folders, repositories, style.                            |

Inside `apps/web/src`:

| Path                         | What it is                                                                                                                                                                         |
| ---------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `routes.ts`, `router.tsx`    | Virtual route config and the router.                                                                                                                                               |
| `routes/`                    | `__root` and `/api/rpc/$`.                                                                                                                                                         |
| `platform/`                  | Server wiring: `config/`, `app.layers`, `app.runtime` (`ManagedRuntime`), `rpc/` (base, context, router, handler, error mapping, browser and SSR clients), `system/system.router`. |
| `modules/shell/presentation` | The pathless layout route and the shell: sidebar, icon rail, drawer, sidebar preference cookie.                                                                                    |
| `modules/tasks`              | `domain/` calendar logic (`calendar-date`, `day-label`, `upcoming-view` helpers); `presentation/` Upcoming (`/`), Today (`/today`), `useToday`.                                    |
| `components/`                | `not-found`.                                                                                                                                                                       |

## Package layering

```
apps/web ──► packages/contracts ──► packages/domain
    └──────► packages/ui
tooling/* ◄── every workspace
```

Dependencies point one way. Packages are plain TypeScript and React without Effect; the web app owns Effect services and layers. Code moves into a package only when a second consumer needs it ([ADR 0002](docs/decisions/0002-package-layout.md)).

## Request flow

```
browser (orpcQuery + TanStack Query) or SSR (in-process client)
  → contract (packages/contracts)
    → /api/rpc: createRpcHandler (Origin check, context, RPCHandler)
      → router procedure (Effect) → service → port → adapter
```

`createRpcHandler` rejects any `Origin` other than the request's own and `AppConfig.trustedOrigins` (the base URL plus the Vercel branch and deployment hosts). Only `POST` reaches procedures. `system.health` returns `{ ok, version }`.

## Server boundary

Server-only code never reaches the client bundle: `platform/`, `application/`, `infrastructure/`, server-suffixed files and `routes/api.*`. TanStack Start import protection in `apps/web/vite.config.ts` fails the build on a leak; the four browser-safe oRPC client files in `platform/rpc` are excluded. After a build, `apps/web/.vercel/output/static/assets` must not contain `effect/`, `ManagedRuntime` or service names.

## Dates

A day is a `CalendarDate` (`YYYY-MM-DD`). The server cannot know the user's time zone, so `useToday()` reads the date in the browser (`useSyncExternalStore`, `undefined` during SSR, refreshed at local midnight and on tab focus). Calendar helpers work on UTC midnights, so they never cross a DST shift. The Upcoming view shows the selected week (`?week=`): the current week lists 14 days from today with Overdue, a later week lists 14 days from its Monday.

## Shell

From `md` an icon rail is docked and the content keeps a rail-wide gutter; the content column is centered in the rest, so opening or collapsing the sidebar never moves it. From `xl` the owner's choice (full sidebar or rail) is docked and kept in the `soonlist-sidebar` cookie, read during SSR. Below `xl` the full sidebar opens over the content; phones use a drawer.

## Decision records

| ADR                                                            | Decision                                                                            |
| -------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| [0001](docs/decisions/0001-naming-and-layering-conventions.md) | Role-suffixed file names, `src/platform`, Effect layering, the server boundary.     |
| [0002](docs/decisions/0002-package-layout.md)                  | Separate `contracts`, `domain`, `ui`, `db` and `auth` packages and tooling configs. |

Deploy: [docs/deploy-vercel.md](docs/deploy-vercel.md).
