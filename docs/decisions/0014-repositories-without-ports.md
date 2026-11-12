# ADR 0014: Repositories without ports

**Status:** Accepted
**Date:** 2026-11-12

## Context

Each API repository was split in two. The tag sat in `application/<entity>-repository.port.ts` and the Drizzle layer in `infrastructure/<entity>.repository.ts`, so `application/` never imported `infrastructure/`. Services declare their tag and `*Live` layer in one file, so the split applied only to repositories. It also forced the name `task-repository.port.ts`, because the file-role lint allowed a single role per file.

Every repository has one implementation, and the project has no unit tests, so nothing ever swaps one in. Effect provides a layer by its tag, so a test or a second adapter could replace a repository wherever its tag is declared.

## Decision

- A repository declares its `Context.Service` tag, the input types it accepts and its `*RepositoryLive` layer in `infrastructure/<entity>.repository.ts`. Services import it from there. The layers drop the `Drizzle` prefix: `TaskRepositoryLive`, `LabelRepositoryLive`, `CalendarSubscriptionRepositoryLive`.
- Ports (`application/*.port.ts`) stay for adapters of an outside system that the app may replace or run as a no-op: `Analytics` (PostHog), `Auth` (Better Auth) and the desktop ports for Electrobun and AppKit.
- A file name may carry two roles, `<kebab-name>.<role>.<role>.ts`. The last role says what the file is, the first one what it belongs to. `task.repository.types.ts` holds the task repository's input types, because the tag, types and layer together would pass the 400-line limit. `soonlane/file-role-folder` checks both roles, so that file also has to live in `infrastructure/`.

## Consequences

- `application/` services import `infrastructure/*.repository.ts`. `domain-model` no longer flags that import inside a module. A service still reaches another module only through that module's service.
- A new repository is one file. A new port needs a reason beyond "it touches the database".

## Related

- ADR 0001: naming and layering conventions, which this one narrows for repositories
- `AGENTS.md`: Boundaries and Code
- `ARCHITECTURE.md`: module map
