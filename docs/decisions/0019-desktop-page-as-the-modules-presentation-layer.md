# ADR 0019: The desktop page as the modules' presentation layer

**Status:** Accepted
**Date:** 2026-11-18

## Context

The desktop app is two programs in one workspace: the Bun main process (Effect, the Electrobun main SDK) and the page Vite bundles into `views://app` ([ADR 0015](0015-desktop-app-with-its-own-ui.md)). Until SOON-223 the page lived in `src/view` with its own `modules/` and `platform/`, so sign-in, updates and Quick Add each had half their code in one tree and half in the other, and the layout matched no other app in the repo. Igor chose one module tree on 2026-11-17 after a two-round council (SOON-222, SOON-223).

Both programs share one `package.json`, so `effect` and the main SDK resolve from page files too. A folder cannot keep them apart; the guards from SOON-222 do.

## Decision

- `apps/desktop/src` has one module tree, `modules/<module>/{domain,application,infrastructure,presentation}`, as in `apps/web` ([ADR 0001](0001-naming-and-layering-conventions.md)). `main.ts` and `view.tsx` are the two entries. `router.tsx`, `routes/root.route.tsx`, `index.html`, `styles.css` and `build-info.types.ts` sit at the root of `src`, and `platform/rpc` holds the RPC contract (`page-rpc.types.ts`) and the page's two clients.
- `presentation/` is page code. It reaches the main process only over the RPC contract, which it imports as a type, and never imports its own module's `domain/`, `application/` or `infrastructure/`, which run on Effect. The main process's inbound adapter, the RPC handler map in `window/infrastructure/app-window.helper.ts`, stays in `infrastructure/`.
- Modules: `identity` (the session, the Keychain token, sign-in and its screens), `updates`, `quick-add`, `window`, `navigation`, `menu`, `dock-badge`, and the page-only `shell` and `tasks`. Page routes live in the module that owns them; the root route stands alone.
- Three guards hold the boundary. `tsconfig.main.json` (no DOM) and `tsconfig.page.json` (no Bun) are two programs, and `tsconfig.json` only references them, so editors give each file its own half's types. The page build fails when its graph reaches Effect, the main SDK, Bun or Node built-ins or a `src` file that is not the page's (`pageBoundary` in `vite.config.ts`). Lint (`oxlint.desktop.mts`) gives the page the frontend rules and forbids imports across the boundary in both directions.

## Consequences

- A new page folder outside `routes/` and `modules/*/presentation/` belongs to neither TypeScript program and fails the page build; add it to `tsconfig.page.json`, the guard's `PAGE_FILES` and `DESKTOP_PAGE_SCOPE` together.
- `soonlane/module-name` covers desktop modules: a module's service is `<Module>Service` (`IdentityService`, `NavigationService`).
- Tailwind's automatic scan starts at `src`, so `styles.css` excludes the main-process folders.

## Options considered

- Two trees, `src/view` beside the main process with matching module names. Rejected by Igor: it doubles the module names and matches no other app.
- The page as its own workspace. Out of scope: it needs its own dependencies and build.

## Related

- `ARCHITECTURE.md`: Desktop app
- [ADR 0005](0005-desktop-app-layout.md), [ADR 0014](0014-repositories-without-ports.md), [ADR 0015](0015-desktop-app-with-its-own-ui.md)
