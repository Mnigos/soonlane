# apps/web agent rules

- Routes are declared in `src/routes.ts` (virtual route config); route files only wire search validation, `beforeLoad`, loaders and the page component.
- Shareable state (week, view) goes in validated search params; React state only for ephemeral UI.
- Router state (search, params, loader data, route context) is read only in `*.route.tsx` through `Route.useX()` and passed down as props; components and hooks never import `useSearch`, `useParams`, `useLoaderData`, `useRouteContext`, `useMatch`, `getRouteApi` or a `*.route.tsx` file. `Link`, `useNavigate` and `useRouter` are allowed anywhere. (lint-enforced)
- SSR calls procedures in process (`platform/rpc/rpc.client.server.ts`), the browser over `RPCLink`; both meet in `platform/rpc/rpc.client.ts` through `createIsomorphicFn`. Never import a `.server.ts` file directly from browser code.
- Date-dependent UI renders from `useToday()`, which is `undefined` during SSR: render a skeleton until the browser supplies the date.
- UI primitives come from `@soonlane/ui` (`@soonlane/ui/components/*`, `@soonlane/ui/cn`); feature components stay in their module. Follow `DESIGN.md` and the tokens in `tooling/tailwind-config/tokens.css`.
- Components take `Readonly<Props>` with the props interface right above them.
- Read the session through `identity.me` (the session layout's `beforeLoad`, then `context.me`; public site routes never read the session); the shell route redirects signed-out visitors to `/login`. Use `@soonlane/auth/client` only for sign-in, sign-out and account deletion, and import `@soonlane/auth/server` only in `identity/infrastructure`.
- Every procedure that reads or writes user data uses `requireUser` and passes `context.user.id` down; every repository query filters by `owner_id`. There is no test login or auth bypass.
- Repository methods are verbs naming the query, never predicates. `find*` returns one row or `undefined`, `list*` an array, `count*` a number; `create`, `update`, `delete` and domain verbs (`assignLabel`, `setCompletion`) return the affected row or `undefined` when the owner has no such row. No `is*`, `has*` or `*Exists` methods: existence is what the service concludes from the returned row, and uniqueness comes from a constraint the service maps to a domain error (`isUniqueViolation` in `platform/db`).
- No `.then`/`.catch` chains on promises: `await` them with `try`/`catch` (or early returns); server code inside Effect keeps Effect idioms such as `Effect.tryPromise` and `Effect.catch`.
- JSDoc (`/** … */`) on a declaration (exported or module-level function, component, hook, type, constant) is welcome when it says what the thing is for, its contract, or a non-obvious why. Keep it short; don't restate the name.
- `//` comments inside function bodies are the exception: only for a quirk or constraint the reader would otherwise "fix" wrongly. Prefer moving that why into the declaration's JSDoc.
- No comment narrates history ("previously", "now") or explains React, TanStack or Effect basics.
