# Context Format

Soonlist keeps context docs and ubiquitous language separate.

- `UBIQUITOUS_LANGUAGE.md` is the glossary: canonical terms, aliases, ambiguity resolution, and example dialogue.
- `CONTEXT.md` is the root domain context: scope, responsibilities, ownership, relationships, and links to ADRs/code.
- `CONTEXT-MAP.md` is the multi-context index when separate durable context docs exist.

Do not use `UBIQUITOUS_LANGUAGE.md` as a substitute for `CONTEXT.md`.

## Root Context Shape

```md
# Context

{One or two sentences describing what this repo/product context is and why it exists.}

## Scope

- {What this context owns}
- {What this context does not own}

## Responsibilities

- {Responsibility}

## Relationships

- **Context A -> Context B**: {relationship, event, policy, or data dependency}

## Language

See `UBIQUITOUS_LANGUAGE.md`.

## ADRs

- `docs/decisions/NNNN-slug.md`: {decision}
```

## Rules

- Keep context docs about ownership, scope, responsibilities, relationships, and constraints.
- Keep term definitions in `UBIQUITOUS_LANGUAGE.md`.
- Link to ADRs instead of restating full decisions.
- Link to important modules/tables only when they clarify ownership.
- Keep implementation details out unless they explain durable ownership or boundaries.
- Create `CONTEXT.md` lazily when repo-level context needs to be persisted.

## Current Context Strategy

The repo currently has a shared glossary in `UBIQUITOUS_LANGUAGE.md`.

Create `CONTEXT.md` when a stable repo-level context summary is needed. Create `CONTEXT-MAP.md` only when durable per-context docs exist or the user asks for that split.

Current known contexts:

- Tasks (calendar days, Upcoming and Today views, later tasks and labels)
- Identity (the owner, sign-in, sessions)

## Future Context Map

Recommended future shape, once the desktop app or a second bounded context makes per-context docs worth it:

```md
# Context Map

## Contexts

- [Tasks](./docs/contexts/tasks.md) - owns tasks, due dates, labels, and the Upcoming and Today views.
- [Identity](./docs/contexts/identity.md) - owns the owner account, Google sign-in, and sessions.

## Relationships

- **Identity -> Tasks**: every task belongs to the signed-in owner; `requireOwner` guards task procedures.
```

When `CONTEXT-MAP.md` exists, read it first and then read only the context docs relevant to the current task.
