# apps/api agent rules

- One Bun process on Railway: `platform/http/http-server.layer.ts` maps paths to handlers (`/health`, `/api/auth/*`, `/api/rpc/*`, `/calendar/*`); `AppLive` in `platform/app.layers.ts` wires every `*Live` layer into the one `ManagedRuntime`.
- Every setting comes from `AppConfig` (`platform/config/app.config.ts`); a missing or malformed variable stops the start with its name. No Vercel variables. Locally Bun reads `apps/api/.env.local`.
- `withCors` answers every preflight and refuses an `Origin` outside `TRUSTED_ORIGINS` before anything else runs; never add `*` or a pattern to the list.
- Only `withClientIp` sets `x-soonlane-client-ip`, and Better Auth reads no other IP header. Never trust `x-soonlane-visitor-ip` without the proxy secret.
- Never log or report a request URL, a token, a cookie or a driver error beyond its name: Drizzle errors embed SQL parameters such as session tokens.
- Every procedure that reads or writes user data uses `requireUser` and passes `context.user.id` down; every repository query filters by `owner_id`. There is no test login or auth bypass.
- Repository methods are verbs naming the query, never predicates. `find*` returns one row or `undefined`, `list*` an array, `count*` a number; `create`, `update`, `delete` and domain verbs (`assignLabel`, `setCompletion`) return the affected row or `undefined` when the owner has no such row. No `is*`, `has*` or `*Exists` methods: existence is what the service concludes from the returned row, and uniqueness comes from a constraint the service maps to a domain error (`isUniqueViolation` in `platform/db`).
- Query pieces a repository shares live in `infrastructure/*.query.ts` and follow the repository rules (no catching); row to contract mappings live in `infrastructure/*.mapper.ts`.
- Pure logic the web app also runs (dates, repeat rules) belongs in `@soonlane/domain`, not in a module's `domain/`.
- No `.then`/`.catch` chains: `await` with `try`/`catch` outside Effect; inside Effect use `Effect.tryPromise` and `Effect.catch`.
- JSDoc on a declaration says what it is for, its contract or a non-obvious why; `//` comments inside function bodies only for a quirk the reader would otherwise "fix" wrongly.
