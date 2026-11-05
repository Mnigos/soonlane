---
name: adr-authoring
description: Creates or updates Soonlist architecture decision records under docs/decisions. Use when the user asks for an ADR, decision record, architecture decision, accepted/proposed decision, or when domain-model work produces a hard-to-reverse architectural trade-off.
---

# ADR Authoring

Use ADRs for durable architecture decisions, not routine implementation notes.

## Related Skills

- Use `domain-model` first for module ownership, Effect ports and layers, server boundary or language-heavy decisions.
- Use `ubiquitous-language` when the ADR introduces or changes domain terms.
- Use [ADR-FORMAT.md](./ADR-FORMAT.md) for the ADR format.

## When An ADR Qualifies

Create or update an ADR only when all are true:

- The decision is hard to reverse.
- The decision would be surprising without context.
- The decision involved a real trade-off.

## Flow

1. Read existing ADRs in `docs/decisions`.
2. Read [ADR-FORMAT.md](./ADR-FORMAT.md).
3. Read `UBIQUITOUS_LANGUAGE.md`, `PRODUCT.md` and `ARCHITECTURE.md` when they touch the decision.
4. Read the root `AGENTS.md`, `apps/web/AGENTS.md` and the affected code patterns.
5. Choose the next number by scanning all `docs/decisions/*.md` files and parsing the leading ADR number.
6. Use `docs/decisions/NNNN-<kebab-title>.md`.
7. Match the existing repo style: title, status, date, context, decision, consequences, and related links when useful.
8. Link to `UBIQUITOUS_LANGUAGE.md` instead of duplicating large term tables.
9. Mark new ADRs `Proposed` unless the user says the decision is accepted.

## Rules

- Keep ADRs concise but complete enough for a future agent to understand why.
- Write ADRs in English, like the rest of the agent-facing docs.
- Record rejected alternatives when they would otherwise be suggested again.
- Include concrete dates, commits, modules and tables when they clarify scope.
- Use `docs/decisions` for every ADR; there is no other ADR folder.
- Keep `UBIQUITOUS_LANGUAGE.md` for glossary terms and `ARCHITECTURE.md` for the module map and decision index; add each new ADR to the `Decision records` table in `ARCHITECTURE.md`.
- Decisions already recorded in `PRODUCT.md` are final; an ADR may cite them but never reopens them.
- Do not create issues from an ADR unless the user asks.
- Do not commit ADR changes unless explicitly asked.
