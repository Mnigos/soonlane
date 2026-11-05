---
name: zod-schemas
description: Zod v4 schema definitions, validation rules, inferred types, coercion, and schema organization. Use when defining input/output schemas, form schemas, internal schemas, or contract schemas.
---

Use this skill for Zod v4 validation in contracts, route search params, forms, internal API parsing, and shared schema files.

## First Read

Before editing, read:

- This skill.
- At least 3 similar existing schema or contract files.
- Any imported schema or validator helper whose API you are not already certain about.

Use those files as the source of truth. Prefer live repo patterns over examples in this skill.

## Working Rules

- Use Zod v4 top-level validators: `z.uuid()`, `z.email()`, `z.url()`.
- For web URLs, prefer `z.url({ protocol: /^https?$/, hostname: z.regexes.domain })`.
- Define inferred types directly under their schema when consumers need the type (`soonlist/inferred-type-placement`).
- Prefer `.optional()` over `.nullable()` at API and form boundaries.
- Use `.nullable()` or `.nullish()` only when persistence or an external API genuinely returns `null`.
- Use `z.coerce.number()` and `z.coerce.date()` for URL query/search params.
- Use `z.coerce.date()` for JSON/OpenAPI output that should become `Date` on the client.
- Use `z.record(keySchema, valueSchema)` in Zod v4.
- For persisted JSON/backfill-compatible snapshots, validate the object shape without stripping still-supported historical keys. Prefer `z.record(...)` or `.passthrough()` when older rows may contain extra valid data.
- Keep schema names camelCase with `Schema`; keep inferred types PascalCase.

## Common Decisions

- Put API boundary schemas in contracts unless they are internal-only.
- In `packages/contracts`, schemas shared by several contracts live in `src/[name].schemas.ts`; everything else stays in `src/[name].contract.ts`. Drizzle tables are `packages/db/schema/[name].schema.ts`.
- Put internal module schemas near the module that owns the parsing.
- Export schemas that are reused; keep one-off schemas local.
- Prefer composing with `.pick()`, `.omit()`, `.extend()`, or shared leaf schemas when the relationship is real.
- Avoid large generic schemas that hide endpoint-specific requirements.

## Verification

- Run `bun run typecheck`.
- Run `bun run check:fix`.
- Run focused validation tests where present, or `bun run test` for behavior changes.
