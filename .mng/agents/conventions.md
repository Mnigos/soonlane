---
title: Conventions
kind: nit
when:
  paths:
    - apps/**
    - packages/**
    - tooling/**
  exclude:
    - '*.gen.ts'
    - '*.md'
    - '*.json'
    - .env.example
    - packages/db/migrations/**
needs: ['Check, typecheck, build']
---

Check the changed code against the written rules below. `bun run check` already fails every rule marked "(lint-enforced)", so report one of those only when the code reaches around the lint rule (a disable comment, a renamed import, a cast). Report the rules lint cannot see:

- A comment that narrates history ("previously", "now", "used to") or explains React, TanStack or Effect basics; a `//` comment inside a function that is not a quirk the reader would otherwise "fix" wrongly; JSDoc that restates the name.
- An implementation file past 400 lines.
- A repository method named as a predicate (`is*`, `has*`, `*Exists`) or a `find*`, `list*`, `count*` that returns something else.
- A query on `task` outside `owned-tasks.query.ts` and the four allowlisted statements, or an allowlisted statement whose `where` lacks `ownedBy(ownerId)`.
- A new module, service, router, table or event whose singular or plural form breaks the naming rule.
- Code placed in the wrong layer: Effect or a framework in `domain/`, a port for something that is not an outside system, pure date logic both apps run kept in a module instead of `@soonlane/domain`.
- A component's props not `Readonly<Props>` with the interface right above it.

Name the rule each finding breaks.

@/AGENTS.md#Code
@/AGENTS.md#Boundaries
