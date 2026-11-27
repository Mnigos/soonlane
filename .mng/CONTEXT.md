# Review context

Soonlane is a personal task list: anyone signs up and gets their own tasks, labels and projects. The API (`apps/api`, Bun and Effect 4) is the only code that reaches Postgres and Better Auth's server; the web app (`apps/web`, TanStack Start), the macOS app (`apps/desktop`, Electrobun) and the phone app (`apps/mobile`, Expo) call it over oRPC with contracts from `packages/contracts`. `ARCHITECTURE.md` maps the code and `AGENTS.md` holds the rules; most rules are lint-enforced, so this file lists only what lint cannot see.

## Intentional patterns, not bugs

- Repositories have no ports (ADR 0014): a service imports the repository tag from `infrastructure/<entity>.repository.ts` directly. Ports exist only for outside systems the app may replace (`Auth`, `Analytics`, `Email`, `TodoistApi`, `LinearApi`).
- Repositories and `*.query.ts` pieces never catch; a `DbError` goes up to the service, which maps a constraint violation to a domain error (`isUniqueViolation`, `isForeignKeyViolation`). Uniqueness is checked by the index, not by a read before the write.
- `ownedTasks` and `ownedBy` in `owned-tasks.query.ts` are the only owner filter on the task table; a query built from them is owner-scoped even though it shows no `ownerId`.
- Repository methods return `undefined` for a row the owner does not have; the service turns that into NOT_FOUND. Another user's id answers the same as a missing one, on purpose.
- Effects run through the one `ManagedRuntime` (`platform/app.runtime.ts`) at a framework edge, or with `Effect.runPromiseWith`/`runSyncWith` and a context captured inside a layer. Only the standalone `Effect.runPromise`, `runSync` and `runFork` are limited to `main.ts`.
- Tagged errors become oRPC errors only in `platform/rpc/rpc.base.ts`; services fail with domain errors and never build an `ORPCError`.
- "Today" comes from the client (`today` in the input, `useToday()` in the browser, `undefined` during SSR). The server never reads its own clock for a calendar day.
- Packages are plain TypeScript and React without Effect; only the API wraps them in layers.
- No unit tests and no test framework exist on purpose; do not report missing tests.
- Ids and `CalendarDate` are branded Zod schemas in `packages/domain`; the single cast to a brand lives in `fromUtcDate` in `calendar-date.helper.ts`.

## Where real bugs tend to hide

- Owner scoping on tables other than `task`: labels, projects, calendar subscriptions and Todoist rows filter by `owner_id` by hand. `task_label` has no owner column, so a query on it must reach both its task and its label through owned rows; one that checks only one side lets an id from another account through.
- The four allowlisted statements that query `task` themselves (`task-update.query.ts`, `task-progress.query.ts`, `label.repository.ts`, `project.repository.ts`) must keep `ownedBy(ownerId)` in every `where`; lint does not check them.
- `Db.transaction` reruns its body when Postgres aborts it as a deadlock, so the body may only write to the database. An email, analytics event or outside call inside it runs again on each retry.
- Subtask trees: writes that reach other tasks of a tree take `lockPath`/`lockPaths` first, in depth-then-id order. A new write path that locks in another order, or not at all, can deadlock or lose completion carried to subtasks.
- Error mapping copies every field of a tagged domain error except the internal ones into the oRPC error's `data`, so a field added to an error reaches the client. Logs must never carry a driver error's message, a URL, a token or a cookie: Drizzle errors embed SQL parameters such as session tokens.
- Date arithmetic on `CalendarDate`: repeat rules, overdue and upcoming ranges, month layout. An off-by-one at month ends, a time-zone shift through `Date`, or `today` taken from the server shows tasks on the wrong day.
- Optional fields on edits. On `tasks.edit` an absent field keeps its value and `null` clears it. The older `tasks.update` clears an absent description, due date and due time, but keeps an absent project, repeat rule and goal. Mixing the two up drops data the client did not show.
- The web app's server boundary: browser code importing a `.server.ts` file or server-only package, SSR forwarding more cookies than this environment's session and consent ones, or a `Set-Cookie` from the API not passed back.
- The desktop app's split: the page (`view.tsx`, `routes/`, each module's `presentation/`, `platform/rpc/`) never imports the main process, Effect or Electrobun outside `platform/rpc/`, and keeps the bearer token in memory only. The main process runs Electrobun only in `infrastructure/`, `platform/electrobun/` and `main.ts`.
- Optimistic cache updates in `packages/app`: the open-task views share the `tasks.list` key, while Completed, Search and subtasks have their own (`tasks.listCompleted`, `tasks.search`, `tasks.listSubtasks`). An update that writes unparsed mutation variables or the wrong shape, or a mutation that skips `refreshTaskLists`, leaves a view wrong until a refetch.
