# Soonlane

Personal task list with an Upcoming-first view, shaped like Todoist's dark theme. Upcoming, Today and Labels; no projects, Inbox, filters or reporting. See [PRODUCT.md](PRODUCT.md).

Production: https://soonlane.com

## Monorepo

| Directory                   | Purpose and main technology                                                               |
| --------------------------- | ----------------------------------------------------------------------------------------- |
| `apps/web`                  | Web app and API: TanStack Start (React 19, Router, Query), Effect 4, oRPC v2, Tailwind 4. |
| `apps/desktop`              | macOS app: an Electrobun window that loads the web app.                                   |
| `packages/contracts`        | oRPC contract and Zod schemas shared by server and browser.                               |
| `packages/domain`           | Branded types such as `CalendarDate`.                                                     |
| `packages/db`               | Drizzle schema, migrations and the migrator for Neon Postgres.                            |
| `packages/auth`             | Better Auth factory (Google, open sign-up, OAuth proxy) and the browser auth client.      |
| `packages/ui`               | Shared React primitives (`button`, `dialog`, `popover`, `menu`, `sidebar`, …) and `cn`.   |
| `tooling/typescript-config` | tsconfig presets every workspace extends.                                                 |
| `tooling/tailwind-config`   | Tailwind 4 theme and the Todoist-like dark tokens.                                        |
| `tooling/oxlint-plugins`    | `soonlane/*` lint rules for file names, spec pairing, hooks, repositories and style.      |

Layout, package layering, request flow and the server boundary: [ARCHITECTURE.md](ARCHITECTURE.md). Product and design: [PRODUCT.md](PRODUCT.md), [DESIGN.md](DESIGN.md). Rules for file names, layering and tests: [AGENTS.md](AGENTS.md) and [apps/web/AGENTS.md](apps/web/AGENTS.md).

## Getting started

Prerequisites: Bun **1.4.2** (pinned by `packageManager`). Node is not needed: `bunfig.toml` runs every script and tool under Bun, including the Vite build.

```sh
bun install
bunx vercel@latest env pull apps/web/.env.local --environment=development --scope mnigos-projects --yes
bun run db:migrate
bun run dev
```

The app runs at **http://localhost:3000** (the port is fixed; Google OAuth expects it).

## Scripts

Run with `bun run <script>` from the root.

| Script                | Purpose                                                    |
| --------------------- | ---------------------------------------------------------- |
| `dev`                 | Web development server on port 3000.                       |
| `build`               | Production build for Vercel (`apps/web/.vercel/output`).   |
| `typecheck`           | TypeScript in every package.                               |
| `check` / `check:fix` | oxlint and oxfmt through Ultracite.                        |
| `commit`              | Commitizen prompt for a conventional commit.               |
| `db:generate`         | Drizzle migration from `packages/db/schema`.               |
| `db:migrate`          | Apply migrations to the database in `apps/web/.env.local`. |

## Desktop

`apps/desktop` is an Electrobun shell around the hosted web app (ADR 0004). From `apps/desktop`: `bun run dev` opens it against the dev server on port 3000, `bun run package` builds the unsigned `.app` and `.dmg` into `build/` and `artifacts/`, and `bun run sdk` downloads the Electrobun toolchain and SDK (needed once before `bun run check`).

Sign-in returns to the app through a `soonlane://` link, which macOS delivers only to an app in `/Applications`, so `bun run dev` cannot finish a sign-in. `bun run dev:applications` builds a dev copy, installs it as `/Applications/Soonlane-dev.app` and runs it against `http://localhost:3000`. Keep only one installed copy that claims `soonlane`.

## Commits

Conventional commits. `bun install` sets up husky: `pre-commit` runs `lint-staged` (Ultracite on staged files), `commit-msg` runs `commitlint`; CI runs `commitlint` on every pull request.

## Reviews

On your own open pull request, comment `/approve` or `/request-changes` on a line of its own (in the Conversation tab or as a Comment review); the Owner Review Commands workflow submits that review for the current head, and new commits dismiss its approval.

## Releases

Versions, the changelog and GitHub Releases come from the release workflow; see [docs/release.md](docs/release.md).

## Blog

Posts are MDX files published by merging to `main`; see [docs/blog.md](docs/blog.md).

## Deploy

Vercel, Root Directory `apps/web`, Bun 1.4 function in `fra1`, previews enabled. Details: [docs/deploy-vercel.md](docs/deploy-vercel.md).

## License

Copyright (C) 2026 Igor Makowski. Soonlane is free software under the [GNU Affero General Public License v3.0 only](LICENSE) (`AGPL-3.0-only`): you may use, change and share it, and if you run a modified version as a network service, you must offer its source to its users.
