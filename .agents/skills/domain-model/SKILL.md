---
name: domain-model
description: Stress-tests plans and architecture against the Soonlist modules, Effect ports and adapters, domain language, product docs and code reality. Use when adding a module, moving logic between domain/application/infrastructure/presentation, introducing a port, service or layer, naming domain concepts, or checking a plan against the domain model.
---

# Domain Model

Use this skill to sharpen architecture and language before implementation.

## Sources

Read the relevant sources for the topic:

- `PRODUCT.md` (decisions there are final)
- `ARCHITECTURE.md` for the module map and the server boundary
- `UBIQUITOUS_LANGUAGE.md` for canonical domain terms and their UI labels
- The root `AGENTS.md` naming table and Effect layering rules
- Existing modules and at least 3 similar files before proposing folder or boundary changes

## Flow

1. Identify the affected modules (see the module table in `ARCHITECTURE.md`) and which one owns the behavior.
2. Compare the plan with current code behavior and the product docs.
3. Call out conflicts between language, docs and code.
4. When the user asks to brainstorm or push back, stay analysis-only until they explicitly say to proceed.
5. Ask one sharp question at a time only when code and docs cannot answer it.
6. Propose canonical terms for vague or overloaded language.

## Boundaries

- `domain/`: types, branded ids, tagged errors (`*.errors.ts` with a `code` field) and pure helpers. No Effect services, framework, ORM or RPC imports.
- `application/`: ports (`*.port.ts`, a `Context.Service` without implementation) and services (`*.service.ts`, a `Context.Service` plus its `*Live` layer, methods via `Effect.fn('Service.method')`). Services orchestrate ports and other services; they never touch Drizzle or HTTP directly.
- `infrastructure/`: adapters that implement ports. `*.repository.ts` runs every query through `Db.run` and never catches or translates errors; `*.layer.ts` wraps an external system (Better Auth, future providers); `*.parser.ts` turns external HTML/JSON into domain readings; `*.client.ts` talks to one external API.
- `presentation/`: oRPC routers (`*.router.ts`), raw HTTP handlers (`*.handler.ts`), middleware, components, hooks and helpers. Routers and handlers resolve services from the runtime context and map nothing themselves; tagged errors become oRPC errors only in `platform/rpc/rpc.base.ts`.
- `platform/`: config, `Db`, the composed `AppLive` in `app.layers.ts` and the single `ManagedRuntime` in `app.runtime.ts`. A new `*Live` layer is wired there, with its ports provided right below the service that needs them.
- Cross-module use goes through another module's service or port; importing another module's `infrastructure/` is reserved for shared adapters that have no port yet and should be flagged.
- Everything under `platform/`, `application/` and `infrastructure/` is server-only; browser code reaches it only through oRPC.

## Rules

- Use current repo architecture over generic DDD examples; there is no CQRS, event bus or outbox here.
- Apply structure selectively to the module whose ownership changes; do not reshape untouched modules.
- Flag "task", "date", "due", "today" and "overdue" when they are used ambiguously; "today" is always the user's local calendar day.
- Do not create ADRs, tickets, commits or comments unless the user asks.
