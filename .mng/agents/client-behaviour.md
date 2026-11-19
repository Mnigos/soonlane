---
title: Client behaviour
kind: bug
when:
  paths:
    - apps/web/src/**
    - packages/app/src/**
    - packages/ui/src/**
    - apps/desktop/src/view.tsx
    - apps/desktop/src/router.tsx
    - apps/desktop/src/routes/**
    - apps/desktop/src/modules/*/presentation/**
    - apps/desktop/src/platform/rpc/**
    - apps/mobile/app/**
    - apps/mobile/src/**
  exclude:
    - '*.gen.ts'
  triage: 'changes what a screen in the web, desktop or phone app shows or does: task lists, dates, optimistic updates, navigation, forms, dialogs or keyboard shortcuts'
needs: ['Check, typecheck, build']
---

Find changes that break what a user sees or does in the web app, the macOS app or the phone app.

Trace each changed screen, hook and mutation:

- Dates. Every "today" comes from `useToday()` (undefined during SSR, so the screen shows a skeleton) or the input the client sent; never `new Date()` turned into a calendar day on the server or during SSR. Check month ends, week starts, DST and the user's local midnight.
- The task caches. The open-task views share the `tasks.list` key; Completed, Search and subtasks use `tasks.listCompleted`, `tasks.search` and `tasks.listSubtasks`. An optimistic update writes values parsed with the procedure's input schema, keeps the cached shape, and rolls back on error; a mutation refreshes every list that shows the task through `refreshTaskLists`.
- Optional fields on edits. On `tasks.edit` absent keeps a value and `null` clears it; the older `tasks.update` clears an absent description, due date and due time. A form that sends `null`, or calls `tasks.update` without a field it does not show, drops the user's data.
- Routing in the web and desktop apps (TanStack Router). Links go through `APP_PATHS`; router state is read only in `*.route.tsx`; a redirect or `beforeLoad` that loops, or a signed-out visitor who reaches a shell route. The phone app uses Expo Router instead, under its own rules below.
- The web server boundary: browser code that imports a `.server.ts` file or a server-only package, SSR forwarding cookies beyond this environment's session and consent cookies, or the API's `Set-Cookie` not reaching the page.
- The desktop page: imports of the main process, Effect or Electrobun outside `platform/rpc/`, and the bearer token written anywhere but memory.
- Focus, keyboard and dialogs: a shortcut that fires while typing in a field, a dialog that cannot be closed, a lost focus after a mutation.

Proof is the user's steps, the line that misbehaves and what the user sees instead of the intended result.

@/apps/web/AGENTS.md
@/packages/app/AGENTS.md
@/apps/mobile/AGENTS.md
@/ARCHITECTURE.md#Dates
