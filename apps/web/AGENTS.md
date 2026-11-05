# apps/web agent rules

Rules for the TanStack Start app: routes, loaders, SSR prefetching, components, hooks, oRPC/TanStack Query calls and server routes. Root `AGENTS.md` still applies; read at least 3 similar files before editing.

## Routes

- Routes are declared in the virtual route config `src/routes.ts`. Page and API routes of a module live in `src/modules/[module]/presentation/routes/*.route.ts(x)`; the root route, the `app-layout` shell route and platform API routes (`/api/rpc/$`) live in `src/routes`.
- Keep route files thin: search validation, `beforeLoad` auth decisions, loader wiring and page composition.
- Server routes (`api.*.route.ts`) only wire a handler from `presentation/*.handler.ts` or `platform/` to `runtime.context()`; logic stays in the handler.
- Define route search params in `validateSearch` before reading or writing them; parse and coerce at that boundary so components consume typed search state.
- Use `getRouteApi()` hooks at module scope for route access in pages and child components.
- Use URL params for shareable state (tab, sort, view); React state only for ephemeral UI.

## Data

- Never use direct `useEffect`; follow the `no-use-effect` skill. (enforced by `no-restricted-imports` and `no-restricted-properties` for `React.useEffect` outside `use-*.ts` hooks)
- Do not use `useSuspenseQuery`; use `useQuery` with explicit loading, error, empty and success states. (enforced by `no-restricted-imports`)
- Build queries and mutations from `orpcQuery` in `lib/orpc/rpc-query.client.ts` with `.queryOptions()`/`.mutationOptions()`; pass all options inside them and never spread generated options into another object.
- Use `enabled` for query preconditions.
- Use loaders to prefetch data for SSR when route-level data is known (`context.queryClient.query(context.orpc.….queryOptions(...))`).
- In child loaders and `beforeLoad`, read the root auth context (`context.me`) instead of refetching the session.
- Use `.key()` for broad invalidation and `.queryKey()` for exact cache reads and writes; shared cache updates live in `presentation/helpers/*.helper.ts`.
- Name `useQuery`/`useMutation` results by their role: a component with a single query destructures what it needs; only a component with several keeps the objects and suffixes them `Query`/`Mutation`.

## Hooks

- A hook takes the `Query` suffix (`*Queries` for several, `*InfiniteQuery` for infinite) only when it does nothing but build and return TanStack Query object(s); a hook that derives state, combines queries or wraps a mutation flow has no suffix (`useToday`). Mutation hooks that only return `useMutation(...)` end in `Mutation`. The file mirrors the hook name (`use-today.ts`). (enforced by `soonlist/hook-query-naming`)
- `hooks/` holds only `use-*.ts(x)` files and their specs. (enforced by `soonlist/hooks-dir-only-hooks`)

## Components

- Components use named props interfaces directly above the component and `Readonly<ComponentNameProps>`.
- Component files are bare kebab-case `.tsx` with a PascalCase export; skeletons end in `.skeleton.tsx`. Group a module's components into role folders once three or more share a role.
- Use `cn` from `@soonlist/ui/cn` and the primitives in `@soonlist/ui/components/*`; promote a component to `packages/ui` only when it is app-agnostic (see `packages/ui/AGENTS.md`).
- Avoid manual memoization for derived route, search or query state.
- Visual work follows `DESIGN.md` and the tokens in `tooling/tailwind-config/tokens.css` (imported by `src/styles.css`); red (`primary`, `danger`) marks actions and overdue state. Use `impeccable` for design work.
- Date-dependent UI renders from `useToday()`; it is `undefined` during SSR, so render a skeleton until the browser supplies the local date.

## Server Boundary

- Browser-reachable files never import `platform/`, `application/`, `infrastructure/` or server-suffixed files (`*.router.ts`, `*.handler.ts`, `*.port.ts`, `*.service.ts`, `*.repository.ts`, `*.layer.ts`, `*.middleware.ts`, `*.server.*`). Import protection in `vite.config.ts` fails the build on a leak.
- SSR calls procedures in-process through `lib/orpc/rpc.client.server.ts`; the browser goes over HTTP through `RPCLink`. Both are wired in `lib/orpc/rpc.client.ts` with `createIsomorphicFn`, so the client build never resolves the server file.

## Verification

- Run `bun run typecheck`, `bun run check:fix` and focused specs, or `bun run test` for behavior changes.
- Run `bun run build` after changing imports between browser and server code.
- For visible UI changes, capture desktop and mobile screenshots before reporting completion.

## Testing

Root `AGENTS.md` holds the Vitest rules. Before editing specs, read at least 3 existing specs of the same kind (component, hook, helper, route, handler) and reuse their render, router and `tests/support/rpc-context.mock.ts` setup instead of inventing new wrappers.
