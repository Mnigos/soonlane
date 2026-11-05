# Glossary Format

`UBIQUITOUS_LANGUAGE.md` at the repo root is the glossary: canonical terms, their UI labels and code names. It is not a context doc (see [CONTEXT-FORMAT.md](./CONTEXT-FORMAT.md)) and not the module map (`ARCHITECTURE.md`).

## Shape

```md
# Ubiquitous language

## <Area>

| Term               | UI label   | Code              | Meaning                  |
| ------------------ | ---------- | ----------------- | ------------------------ |
| **Canonical term** | `UI label` | `codeName`/`enum` | One-sentence definition. |

## Flagged Ambiguities

- "ambiguous word" should mean **Canonical term** in this context.
```

## Rules

- Choose one canonical term and pair it with the exact UI label the owner sees; when they differ (a heading reads `Today` for the **Current day**), record both.
- Take UI labels from the code (`day-label.helper.ts`, `shell-sidebar.tsx`, `overdue-section.tsx`), not from memory; when a doc and the UI disagree, record the UI label and flag the mismatch.
- One-sentence definitions; only domain and repo-specific terms.
- Group terms by module or product area (`tasks`, `identity`, `shell`, codebase).
- Keep good existing terms; change a definition only when understanding changes.
- Link to the glossary from other docs instead of copying term tables.
