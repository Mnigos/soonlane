---
title: Ownership and auth
kind: bug
when:
  paths:
    - packages/auth/**
    - packages/db/schema/auth.schema.ts
    - apps/api/src/modules/*/infrastructure/**
    - apps/api/src/modules/*/presentation/**
    - apps/api/src/modules/identity/**
    - apps/api/src/platform/http/**
    - apps/api/src/platform/rpc/**
    - apps/web/src/platform/**
    - apps/web/src/modules/identity/**
    - apps/desktop/src/modules/identity/**
    - apps/mobile/src/platform/auth/**
    - tooling/oxlint-plugin/rules/task-owner-scope.rule.mts
  triage: 'changes which rows a query returns or writes for which user, a procedure without requireUser, sessions, cookies, tokens, sign-in or sign-up, account deletion, CORS, the client IP or the private calendar link'
needs: ['Check, typecheck, build']
---

Find changes that let one account read or change another account's data, or that weaken sign-in, sessions or the private calendar link.

Trace each changed procedure from its router through the service to every query it runs:

- The procedure that reads or writes user data sits behind `requireUser` and passes `context.user.id` down; no id from the input stands in for the owner.
- Every query on `task` goes through `ownedTasks(database, ownerId)` or carries `ownedBy(ownerId)` (the allowlisted statements in `task-update.query.ts`, `task-progress.query.ts`, `label.repository.ts`, `project.repository.ts`). Every query on `label`, `project`, `calendar_subscription` and the Todoist tables filters `owner_id` itself, on each side of a join and inside each subquery. `task_label` has no owner column: a query on it reaches both its task and its label through owned rows.
- An id taken from the input (task, label, project, parent) is checked against the owner before it is written into a row of the owner, including ids written through `insert ... select` and `onConflict` paths.
- A write that finds no owned row returns `undefined` and ends as NOT_FOUND, never as a write to a row it did not check.

For `packages/auth`, the API's `identity`, `http` and `rpc` platform code and the clients' sign-in code, check the change against the rules below and name the rule it breaks. Cookie names come from the prefix, return addresses only from `trustedOrigins`, the bearer plugin keeps its signature check, `x-soonlane-visitor-ip` is trusted only with the proxy secret, account deletion keeps its recent-login check, and nothing logs a token, cookie, URL or driver error message.

Proof is a concrete path: the procedure, the input an attacker controls, and the query or handler line where another account's row or session is reached. A missing check that a caller upstream already performs is not a finding; show that no caller does.

@/apps/api/AGENTS.md
@/packages/auth/AGENTS.md
@/ARCHITECTURE.md#Client IP
@/ARCHITECTURE.md#Calendar subscription
