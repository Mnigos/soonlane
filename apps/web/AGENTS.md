# apps/web agent rules

- Routes are declared in `src/routes.ts` (virtual route config); route files only wire search validation, `beforeLoad`, loaders and the page component.
- Shareable state (week, view) goes in validated search params; React state only for ephemeral UI.
- SSR calls procedures in process (`platform/rpc/rpc.client.server.ts`), the browser over `RPCLink`; both meet in `platform/rpc/rpc.client.ts` through `createIsomorphicFn`. Never import a `.server.ts` file directly from browser code.
- Date-dependent UI renders from `useToday()`, which is `undefined` during SSR: render a skeleton until the browser supplies the date.
- UI primitives come from `@soonlane/ui` (`@soonlane/ui/components/*`, `@soonlane/ui/cn`); feature components stay in their module. Follow `DESIGN.md` and the tokens in `tooling/tailwind-config/tokens.css`.
- Components take `Readonly<Props>` with the props interface right above them.
- Read the session through `identity.me` (root `beforeLoad`, then `context.me`); the shell route redirects signed-out visitors to `/login`. Use `@soonlane/auth/client` only for sign-in and sign-out, and import `@soonlane/auth/server` only in `identity/infrastructure`.
- Owner procedures use `requireOwner`; there is no test login or auth bypass.
