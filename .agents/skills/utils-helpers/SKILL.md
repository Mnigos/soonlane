---
name: utils-helpers
description: Utils and helpers organization, extraction decisions, pure functions, JSDoc policy, and shared helper placement. Use when extracting or modifying reusable utility/helper functions.
---

Use this skill when extracting or changing helper functions, utils, shared transformations, parsing helpers, or small reusable domain functions.

## First Read

Before editing, read:

- This skill.
- At least 3 similar existing util or helper files.
- Any imported helper, external utility, or domain type whose API you are not already certain about.

Use those files as the source of truth. Prefer live repo patterns over examples in this skill.

## Working Rules

- Utils are global, domain-agnostic, and reusable across modules.
- Helpers are module-specific and may contain domain logic.
- File names are kebab-case with a role suffix: utils are `*.util.ts` in a `src/utils/` folder (`cn` in `packages/ui/src/utils/`), helpers are `*.helper.ts` (see the naming table in the root `AGENTS.md`).
- Add JSDoc only when the contract or the why cannot be read from the name and types; never restate the signature.
- Prefer pure functions with descriptive names.
- Reuse existing UTC/date/number parsers when a shared util or module helper fits; do not add private duplicated parsers.
- Do not create helpers whose only purpose is defensive coercion for already-typed internal values. Avoid generic `unknown` -> fallback wrappers unless the input is genuinely untrusted.
- Type guards are allowed for real runtime unions or external/persisted payloads only. Do not use them to re-check data the TypeScript type system already owns.
- Do not hide invalid data by defaulting, e.g. `Number(value ?? 0)` or `new Date(String(value))`, unless that behavior is explicitly part of the product/API contract.
- Use Zod schemas for parsing hydrated JSON when schema validation is useful.
- Use `to*` names only for transformations. Use `get*` for message or label selection.
- Use function declarations for exported helpers unless an expression-body arrow is clearly cleaner.
- Avoid single-letter and cryptic callback names.
- Keep named interfaces/types directly above the helper that uses them.
- Do not add trivial pass-through helpers that only reshape a couple fields once.
- Do not keep module helper files that only re-export a promoted shared util. Update consumers to import the shared util directly and delete the old helper/spec unless a real compatibility boundary requires it.
- Domain logic that does not need injected dependencies should be a standalone helper, not a private service method.

## Common Decisions

- Extract when a function is more than 5 lines, reused, and easier to test or reason about outside the caller.
- Keep logic local when extraction would obscure a one-off flow.
- Put module-specific helpers in the layer that owns them: pure domain rules in `domain/*.helper.ts`, UI formatting and cache updates in `presentation/helpers/*.helper.ts`, row mapping and external parsing support in `infrastructure/*.helper.ts`.
- Drizzle `SQL` fragments and orderings stay in `infrastructure/` next to the repository that runs them.
- Promote to a shared util only when it is domain-agnostic and useful across boundaries.
- Reuse the calendar helpers in `tasks/domain/calendar-date.helper.ts` before adding new date arithmetic or formatting.

## Verification

- Run `bun run typecheck`.
- Run `bun run check:fix`.
- Add focused tests for non-trivial parsing, transformation, or branching behavior.
