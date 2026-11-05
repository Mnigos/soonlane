---
name: ubiquitous-language
description: Maintains the repo root UBIQUITOUS_LANGUAGE.md glossary of Soonlist domain terms, pairing each canonical term with its UI label and code name. Use when defining domain language, naming a new concept, resolving term conflicts, updating ADR terminology, or when the user mentions ubiquitous language, domain model, or glossary.
---

# Ubiquitous Language

Use this skill to keep Soonlist domain language explicit and consistent between the UI copy, the code and the docs.

## Flow

1. Read `UBIQUITOUS_LANGUAGE.md`.
2. Scan the current conversation, relevant ADRs in `docs/decisions`, `PRODUCT.md`, and touched code/docs for domain terms.
3. Identify synonyms, overloaded terms, vague terms, mismatches between UI labels and code names, and module boundary confusion.
4. Pick canonical terms and update `UBIQUITOUS_LANGUAGE.md`.
5. If another artifact defines many terms, link to the glossary instead of duplicating a large table.
6. Summarize added terms, renamed aliases, and any remaining ambiguity.

## File Shape

Keep the glossary in this shape:

```md
# Ubiquitous Language

## <Area>

| Term               | UI         | Code              | Definition               | Aliases to avoid    |
| ------------------ | ---------- | ----------------- | ------------------------ | ------------------- |
| **Canonical term** | `UI label` | `codeName`/`enum` | One-sentence definition. | synonym, vague term |

## Relationships

- **Term A** owns or produces **Term B**.

## Example Dialogue

> **Dev:** "Short question using the terms?"
>
> **Owner:** "Short answer clarifying ownership."

## Flagged Ambiguities

- "ambiguous word" should mean **Canonical term** in this context.
```

## Rules

- Be opinionated; choose one canonical term and pair it with the exact UI label shown to the owner. When the UI label differs from the term (a heading reads `Today` for the **Current day**), record both and flag the difference if it can confuse.
- Take UI labels from the code (`day-label.helper.ts`, `app-sidebar.tsx`, `overdue-section.tsx` and similar), not from memory; when a doc and the UI disagree, record the UI label and flag the mismatch.
- Keep definitions to one sentence.
- Include aliases to avoid when they prevent future confusion.
- Include only domain terms; skip generic programming terms unless repo-specific.
- Group terms by module or product area (`tasks`, `identity`).
- Preserve existing good terms and evolve definitions only when understanding changes.
- Separate domain concepts from infrastructure, adapters, parsers and mapping code.
- Keep `UBIQUITOUS_LANGUAGE.md` as the source of truth for glossary terms; `ARCHITECTURE.md` stays the module map.
