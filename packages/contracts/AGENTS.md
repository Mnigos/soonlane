# packages/contracts agent rules

Rules for the oRPC contract: procedures, input and output schemas, declared errors, and the schemas shared with apps. Root `AGENTS.md` still applies; read at least 3 similar contract files before editing.

## Working Rules

- This package is the only place contracts live; the web app and the future desktop app depend on it, never on `apps/web`.
- Each router has `src/[name].contract.ts`; `src/app.contract.ts` composes them into `contract`. Schemas shared by several contracts live in `src/[name].schemas.ts`; error maps in `src/[name].errors.ts`.
- Always declare `.output()`. Order: `.errors()`, `.input()`, `.output()`.
- Export Zod-inferred types that apps consume, each directly under its schema. (enforced by `soonlist/inferred-type-placement`)
- Dates without time are `CalendarDate` strings (`YYYY-MM-DD`) from `@soonlist/domain`; the client sends its local "today", the server never derives it.
- Prefer `.optional()` over `.nullable()` at the API boundary; `z.coerce.*` only for values that arrive as strings.
- No Effect, Drizzle, React or server code; this package runs in the browser.
- Use the `zod-schemas` skill for Zod v4 details.

## Verification

- `bun run typecheck`, `bun run check:fix`.
- Run the web specs that call the changed procedure (`rpc.handler.spec.ts`, router specs), or `bun run test`.
