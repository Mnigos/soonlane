# Soonlist

Personal task list with an Upcoming-first view, shaped like Todoist's dark theme. Upcoming, Today and Labels; no projects, Inbox, filters or reporting. See [PRODUCT.md](PRODUCT.md).

Production: https://soonlist.vercel.app

## Monorepo

| Directory                | Purpose and main technology                                                               |
| ------------------------ | ----------------------------------------------------------------------------------------- |
| `apps/web`               | Web app and API: TanStack Start (React 19, Router, Query), Effect 4, oRPC v2, Tailwind 4. |
| `packages/contracts`     | oRPC contract and Zod schemas shared by server and browser.                               |
| `packages/domain`        | Branded types such as `CalendarDate`.                                                     |
| `tooling/oxlint-plugins` | `soonlist/*` lint rules for file names, spec pairing, hooks, repositories and style.      |

Layout, request flow and the server boundary: [ARCHITECTURE.md](ARCHITECTURE.md). Rules for file names, layering and tests: [AGENTS.md](AGENTS.md) and [apps/web/AGENTS.md](apps/web/AGENTS.md).

## Getting started

Prerequisites: Bun **1.4.2** (pinned by `packageManager`) and Node 22+ for the Vite build.

```sh
bun install
bunx vercel@latest env pull apps/web/.env.local --environment=development --scope mnigos-projects --yes
bun run dev
```

The app runs at **http://localhost:3000** (the port is fixed; Google OAuth expects it).

## Scripts

Run with `bun run <script>` from the root.

| Script                | Purpose                                                  |
| --------------------- | -------------------------------------------------------- |
| `dev`                 | Development server on port 3000.                         |
| `build`               | Production build for Vercel (`apps/web/.vercel/output`). |
| `typecheck`           | TypeScript in every package.                             |
| `check` / `check:fix` | oxlint and oxfmt through Ultracite.                      |
| `test`                | Unit tests (Vitest).                                     |

## Deploy

Vercel, Root Directory `apps/web`, Node 22 function in `fra1`, previews enabled. Details: [docs/deploy-vercel.md](docs/deploy-vercel.md).
