# ADR 0001: Naming and layering conventions

**Status:** Accepted
**Date:** 2026-11-05

## Context

Soonlist starts from the conventions of `vinyl-wishlist`, where modules grew with mixed file names and nothing but convention stopped server modules from reaching the client bundle until these rules were adopted. Agents and humans need one predictable answer to "where does this file go and what is it", checked by tooling rather than review, from the first commit.

## Decision

- Every `.ts` file under `apps/web/src` and `packages/*` is `<kebab-name>.<role>.ts` with a NestJS-style role suffix (`.service.ts`, `.port.ts`, `.repository.ts`, `.layer.ts`, `.router.ts`, `.helper.ts` and the rest of the table in `AGENTS.md`). React components stay bare kebab-case `.tsx` and hooks stay `use-*.ts`. Enforced by `soonlist/file-role-suffix` and `soonlist/file-role-folder`.
- Server infrastructure lives in `src/platform` (config, `Db`, `AppLive`, the single `ManagedRuntime`, oRPC wiring), not `src/server`, because `.server.ts` already marks the server half of an isomorphic file.
- Each module follows Effect layering: `domain/` (pure types, tagged errors, helpers), `application/` (ports and services with `*Live` layers), `infrastructure/` (adapters implementing ports), `presentation/` (routers, handlers, middleware, components, hooks).
- The server boundary is enforced by TanStack Start import protection in `apps/web/vite.config.ts` with `behavior: 'error'`, so a server-only module in the client bundle fails the build.
- One spec per source file, beside it with the same base name; cross-file flows are integration specs in `apps/web/tests/integration`. Enforced by `soonlist/spec-file-pairing`.

## Consequences

- A file's role and allowed folder are readable from its name, and lint fails on drift instead of review catching it.
- The default import protection rule for `**/*.client.*` is disabled, because `.client.ts` here means an HTTP client, not a browser-only module.
- Collective specs had to be split, and new helpers need their own spec file.
- Renaming a role or folder now means updating the lint rules in `tooling/oxlint-plugins` along with the files.

## Related

- `AGENTS.md`: File Naming, Effect Layering and Server Boundary
- `ARCHITECTURE.md`: module map and server boundary
- `vinyl-wishlist` ADR 0001, which this one adopts unchanged
