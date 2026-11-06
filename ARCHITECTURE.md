# Architecture

A Turborepo + Bun monorepo. One TanStack Start app serves the UI, SSR, Better Auth at `/api/auth` and the oRPC API at `/api/rpc`, which a future desktop app will call too. Terms: [UBIQUITOUS_LANGUAGE.md](UBIQUITOUS_LANGUAGE.md). Decisions: [docs/decisions](docs/decisions).

## Layout

| Path                        | What it is                                                                                                      |
| --------------------------- | --------------------------------------------------------------------------------------------------------------- |
| `apps/web`                  | TanStack Start app on Vercel (Nitro `vercel` preset, Bun 1.4, `fra1`).                                          |
| `apps/desktop`              | Electrobun macOS shell (Bun main process, WKWebView) that loads `SOONLIST_URL`; no UI of its own.               |
| `packages/domain`           | `@soonlist/domain`: brands (`CalendarDate`, `UserId`) and access messages.                                      |
| `packages/db`               | `@soonlist/db`: Drizzle schema, migrations and the migrator. Server-only.                                       |
| `packages/auth`             | `@soonlist/auth`: `createAuth` (`/server`), the browser client (`/client`), the owner policy (root). No Effect. |
| `packages/contracts`        | `@soonlist/contracts`: the oRPC contract and Zod schemas.                                                       |
| `packages/ui`               | `@soonlist/ui`: app-agnostic React primitives (`button`, `skeleton`, `avatar`, `sidebar`) and `cn`.             |
| `tooling/typescript-config` | tsconfig presets: `base`, `react-library`, `react-app`.                                                         |
| `tooling/tailwind-config`   | Tailwind 4 theme and the tokens described in `DESIGN.md`.                                                       |
| `tooling/oxlint-plugins`    | `soonlist/*` lint rules: file names, hooks folders, repositories, style.                                        |

Inside `apps/web/src`:

| Path                         | What it is                                                                                                                                                                                                                                                                                                                                                  |
| ---------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `routes.ts`, `router.tsx`    | Virtual route config and the router.                                                                                                                                                                                                                                                                                                                        |
| `routes/`                    | `__root` (fetches `identity.me`) and `/api/rpc/$`.                                                                                                                                                                                                                                                                                                          |
| `platform/`                  | Server wiring: `config/`, `db/` (`Db` layer), `app.layers`, `app.runtime` (`ManagedRuntime`), `rpc/` (base, context, router, handler, error mapping, browser and SSR clients), `system/system.router`.                                                                                                                                                      |
| `modules/shell/presentation` | The pathless layout route (redirects signed-out visitors) and the shell: sidebar with the user menu, icon rail, drawer, sidebar preference cookie.                                                                                                                                                                                                          |
| `modules/tasks`              | `domain/` calendar logic and `TaskNotFound`; `application/` `TasksService` and the `TaskRepository` port; `infrastructure/task.repository` (Drizzle via `Db.run`); `presentation/` `tasks.router` (list, create, complete, uncomplete behind `requireOwner`), Upcoming (`/`), Today (`/today`), quick add, the Add task dialog, `useToday`, `useActiveDay`. |
| `modules/identity`           | `BetterAuthLive` (wraps `createAuth`), the `Auth` port, `identity.me`, `requireOwner`, `/login`, `/api/auth/$`, user menu and sign-out.                                                                                                                                                                                                                     |
| `components/`                | `not-found`.                                                                                                                                                                                                                                                                                                                                                |

## Package layering

```
apps/web ──► packages/auth ──► packages/db ──► packages/domain
    ├──────► packages/contracts ──────────────────┘
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

`createRpcHandler` rejects any `Origin` other than the request's own and `AppConfig.trustedOrigins` (the base URL plus the Vercel branch and deployment hosts). Only `POST` reaches procedures. `system.health` returns `{ ok, db, version }`.

## Tasks

A task belongs to the signed-in owner (`task.owner_id`, cascade on user delete) and has a title, an optional description, a due date (`date`, no time zone), an optional due time (`time`), a priority 1 to 4 (default 4), `created_at` and a nullable `completed_at`. `tasks.list` takes `{ from, to, today }` from the browser and returns the open tasks due before `today` (overdue) and between `from` and `to`, ordered by time, priority, then age. Completing is optimistic in the TanStack Query cache and offers Undo (`tasks.uncomplete`). Edit, reschedule and labels come later.

## Sign-in

Better Auth with Google at `/api/auth`, configured by `createAuth` in `packages/auth` and built once by `BetterAuthLive` from `AppConfig` and `Db` ([ADR 0003](docs/decisions/0003-better-auth-in-a-package-behind-an-effect-layer.md)). Only `OWNER_EMAIL`, verified by Google, can be created as a user. Google accepts only the production and localhost redirect URIs, so on Vercel production and previews the `oAuthProxy` plugin sends a preview's sign-in through the production callback and back; both sides share `OAUTH_PROXY_SECRET` (or `AUTH_SECRET`). Local development signs in directly. Details: [docs/deploy-vercel.md](docs/deploy-vercel.md).

## Database

Neon Postgres through `pg` and Drizzle. `Db` owns one pool per runtime (5 connections, 10 s `query_timeout`, an `error` listener); `Db.run` is the only place that creates `DbError`. Logs carry error names only, because driver errors embed SQL parameters such as session tokens. The Vercel build runs the migrator first against the environment's own Neon branch (`main` for production, `preview` for previews and local).

## Server boundary

Server-only code never reaches the client bundle: `platform/`, `application/`, `infrastructure/`, server-suffixed files and `routes/api.*`. TanStack Start import protection in `apps/web/vite.config.ts` fails the build on a leak; it also denies `@soonlist/auth/server`, `@soonlist/db`, `pg` and `drizzle-orm` by specifier, and excludes the four browser-safe oRPC client files in `platform/rpc`. After a build, `apps/web/.vercel/output/static/assets` must not contain `drizzle`, `pg`, `betterAuth(`, `drizzleAdapter`, `oauth-proxy`, `effect/`, `ManagedRuntime` or service names.

## Dates

A day is a `CalendarDate` (`YYYY-MM-DD`). The server cannot know the user's time zone, so `useToday()` reads the date in the browser (`useSyncExternalStore`, `undefined` during SSR, refreshed at local midnight and on tab focus). Calendar helpers work on UTC midnights, so they never cross a DST shift. The Upcoming list renders Overdue and every day from today to the end of the eighth week after the current one. `useActiveDay` (a scroll tracker behind `useSyncExternalStore`, with ref callbacks on the sticky header and each day section) names the active day: the section at the top of the list, just under the header. The week strip and month label follow the active day's week; the arrows step one day, the middle button names the active day (Today, Tomorrow, then e.g. Mon 9 Nov) and returns to today's section, and strip days scroll to their section, all landing just below the header (smooth unless the user prefers reduced motion). There is no `?week=` URL state.

## Shell

From `md` an icon rail is docked and the content keeps a rail-wide gutter; the content column is centered in the rest, so opening or collapsing the sidebar never moves it. From `xl` the owner's choice (full sidebar or rail) is docked and kept in the `soonlist-sidebar` cookie, read during SSR. Below `xl` the full sidebar opens over the content; phones use a drawer.

Inside the desktop app, `<html data-shell="desktop">` (set by its preload) turns on the `desktop:` variant: the rail, the sidebar and the phone bar leave 32px for the traffic lights and carry an `app-drag` strip that moves the window.

## Desktop app

`apps/desktop/src` mirrors the web app's layering ([ADR 0005](docs/decisions/0005-desktop-app-layout.md)). `main.ts` builds `AppLive` from `platform/` (`DesktopConfig` with `SOONLIST_URL`, the `ManagedRuntime`, the Electrobun event helper). Modules: `window` opens the main window and saves its frame to `window-state.json`, ignoring a saved frame that no longer overlaps a display; `navigation` keeps the window on the app's exact origin and sends other web and mail links to the system browser; `menu` sets the app menu.

## Decision records

| ADR                                                                            | Decision                                                                            |
| ------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------- |
| [0001](docs/decisions/0001-naming-and-layering-conventions.md)                 | Role-suffixed file names, `src/platform`, Effect layering, the server boundary.     |
| [0002](docs/decisions/0002-package-layout.md)                                  | Separate `contracts`, `domain`, `ui`, `db` and `auth` packages and tooling configs. |
| [0003](docs/decisions/0003-better-auth-in-a-package-behind-an-effect-layer.md) | Better Auth as a plain factory in `packages/auth`, wrapped by an Effect layer.      |
| [0004](docs/decisions/0004-desktop-shell-with-electrobun.md)                   | An Electrobun macOS shell that loads the hosted web app.                            |
| [0005](docs/decisions/0005-desktop-app-layout.md)                              | Desktop modules (`window`, `navigation`, `menu`) on one Effect runtime.             |

Deploy: [docs/deploy-vercel.md](docs/deploy-vercel.md).
