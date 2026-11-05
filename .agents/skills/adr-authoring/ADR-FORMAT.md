# ADR Format

ADRs live in `docs/decisions/` and use sequential numbering: `0001-kebab-title.md`, `0002-kebab-title.md`, etc.

Use the existing repo title style:

```md
# ADR 0001: {Short Title Of The Decision}
```

## Template

```md
# ADR NNNN: {Short title of the decision}

**Status:** Proposed
**Date:** YYYY-MM-DD

## Context

{What is happening, what constraints matter, and why this decision is needed.}

## Decision

{What we decided and why.}

## Consequences

{Non-obvious downstream effects, trade-offs, and follow-up work.}

## Related

- `ARCHITECTURE.md`: {section}
- ADR NNNN: {related decision}
```

## Rules

- Keep ADRs as short as the decision allows.
- New ADRs default to `Proposed` unless the user says the decision is accepted.
- Include `Context`, `Decision`, and `Consequences` when the decision affects architecture, module ownership, Effect layering, the server boundary, data ownership or production reliability.
- Add `Options Considered` only when rejected alternatives are likely to be suggested again.
- Link to `UBIQUITOUS_LANGUAGE.md` instead of duplicating glossary tables.
- Use concrete dates, commits, module names and table names when they clarify scope.

## Numbering

Scan all `docs/decisions/*.md` files, parse the leading ADR number from names like `0001-kebab-title.md` and `0010-kebab-title.md`, then increment the highest number by one.

## When To Offer An ADR

All three must be true:

1. **Hard to reverse**: changing the decision later has meaningful cost.
2. **Surprising without context**: a future reader would wonder why the code or architecture is shaped this way.
3. **Real trade-off**: there were genuine alternatives and we picked one for specific reasons.

## What Qualifies

- Architecture shape, such as module boundaries or Effect layering.
- Integration patterns between modules, such as a service calling another module's service instead of its repository.
- Technology choices with lock-in, such as database, auth or deployment choices.
- Ownership and scope decisions, such as which module owns a table or a policy.
- Deliberate deviations from the obvious path.
- Constraints not visible in code.
- Rejected alternatives that would otherwise reappear.
