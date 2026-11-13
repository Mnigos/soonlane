# apps/web agent rules

- Routes are declared in `src/routes.ts` (virtual route config); route files only wire search validation, `beforeLoad`, loaders and the page component.
- Shareable state (week, view) goes in validated search params; React state only for ephemeral UI.
- Router state (search, params, loader data, route context) is read only in `*.route.tsx` through `Route.useX()` and passed down as props; components and hooks never import `useSearch`, `useParams`, `useLoaderData`, `useRouteContext`, `useMatch`, `getRouteApi` or a `*.route.tsx` file. `Link`, `useNavigate` and `useRouter` are allowed anywhere. (lint-enforced)
- The server code lives in `apps/api`; this app renders the UI and the browser calls the API host directly. It has no Effect runtime, no database access and no `/api` routes.
- SSR and the browser share one `RPCLink` (`platform/rpc/rpc.client.ts`), which `router.tsx` hands to `@soonlane/app` with `provideRpcLink`, next to sonner's toast, analytics' `capture` and `visibilitychange` through `provideHostPorts`; screens call the API through that package's `orpcQuery`. The browser calls `VITE_API_URL` with its cookies; SSR calls `API_INTERNAL_URL` directly. `createIsomorphicFn` only picks the origin and the fetch (`rpc.client.server.ts` adds the visitor headers, forwards only this environment's session and consent cookies, by name, and passes the API's `Set-Cookie` back). The hint and consent cookie names come from `AUTH_COOKIE_PREFIX` (`modules/identity/presentation/auth-cookie.constants.ts`), never a literal. Never import a `.server.ts` file directly from browser code.
- Date-dependent UI renders from `useToday()`, which is `undefined` during SSR: render a skeleton until the browser supplies the date.
- UI primitives come from `@soonlane/ui` (`@soonlane/ui/components/*`, `@soonlane/ui/cn`); feature components come from `@soonlane/app`, which both host apps render; this app keeps only those of its own pages (site, blog, changelog, identity). Follow `DESIGN.md` and the tokens in `tooling/tailwind-config/tokens.css`.
- Components take `Readonly<Props>` with the props interface right above them.
- Read the session through `identity.me` (the session layout's `beforeLoad`, then `context.me`; public site routes never read the session); the shell route redirects signed-out visitors to `/login`. Use `@soonlane/auth/client` only for sign-in, sign-out, account deletion and linking Todoist; never import `@soonlane/auth/server`.
- Mutation variables carry the contract's input type (plain strings); an optimistic update parses them with the procedure's input schema before writing them into cached output.
- No `.then`/`.catch` chains on promises: `await` them with `try`/`catch` (or early returns).
- JSDoc (`/** … */`) on a declaration (exported or module-level function, component, hook, type, constant) is welcome when it says what the thing is for, its contract, or a non-obvious why. Keep it short; don't restate the name.
- A comment directly above a module-level declaration is JSDoc, never `//`. (lint-enforced)
- `//` comments inside function bodies are the exception: only for a quirk or constraint the reader would otherwise "fix" wrongly. Prefer moving that why into the declaration's JSDoc.
- No comment narrates history ("previously", "now") or explains React, TanStack or Effect basics.
