---
title: Effect services
kind: bug
when:
  paths:
    - apps/api/src/**
    - apps/desktop/src/main.ts
    - apps/desktop/src/platform/**
    - apps/desktop/src/modules/*/domain/**
    - apps/desktop/src/modules/*/application/**
    - apps/desktop/src/modules/*/infrastructure/**
  exclude:
    - apps/desktop/src/platform/rpc/**
  triage: 'changes Effect services, layers, error handling, background work or resource lifetimes in the API or the desktop main process'
needs: ['Check, typecheck, build']
---

Find Effect code in the API and the desktop main process that fails at runtime even though it typechecks.

Trace, for each changed service method, router or layer:

- Error channels. A promise wrapped without `Effect.tryPromise`, so its rejection becomes a defect and an empty 500; an `Effect.catch`, `orElse` or `catchTag` that turns a failure into a success the caller treats as done; `orDie` on an error the client should get as a domain error; a new tagged error without `code`, which `rpc.base.ts` then treats as a fault.
- Layer wiring. A new `*Live` layer not provided in `AppLive` (`platform/app.layers.ts`), or provided twice so two instances hold separate state; a layer that reads `AppConfig` lazily at request time instead of at start.
- Where effects run. `Effect.runPromise`, `runSync` or `runFork` outside `main.ts`; a callback from a library (Better Auth hooks, Bun's server, Electrobun events) that runs an effect without the context captured in its layer, so services are missing or a second runtime starts.
- Resource lifetimes. A pool, client, listener, interval or fiber started without `Effect.acquireRelease` or a scope, so shutdown on SIGTERM leaks it or cuts off queued work; a fiber forked as a daemon that outlives the runtime; a sweep or retry loop with no bound.
- Transactions. `Db.transaction` reruns its body after a deadlock, so the body must only write to the database; an outside call, analytics event or email inside it repeats.

Proof names the effect, the failure or interruption that triggers the wrong path, and what the user or the process sees: a 500, a lost write, a hang, a leak or a crash on start.

@/AGENTS.md#Boundaries
@/docs/decisions/0014-repositories-without-ports.md#Decision
