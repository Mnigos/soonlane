# packages/app agent rules

- Screens both host apps render, the web app and the desktop app ([ADR 0015](../../docs/decisions/0015-desktop-app-with-its-own-ui.md)). Routes, loaders, layouts and anything from `@tanstack/react-start` stay in the host apps and render these screens.
- Never import an app, `@soonlane/auth` or server code, nor Effect, TanStack Start, `@soonlane/db` and `@soonlane/auth/server` (those four lint-enforced). It may import `@soonlane/ui`, `@soonlane/domain`, `@soonlane/contracts`, `@soonlane/analytics`'s browser entries, TanStack Query and TanStack Router.
- Call the API through `orpcQuery` (`@soonlane/app/rpc-query`). The host app hands over its oRPC link once at startup with `provideRpcLink`; the link keeps any per-visitor state.
- What only the host knows (the user menu with sign-out and account actions, the home path, build info, the release notes link) comes from `useHostApp()`; the host renders `HostAppContext` around the screens.
- Link to app views only through `APP_PATHS`, which both host apps' route trees serve.
- Lay out code like the web app's `presentation/` folders: `src/modules/<module>/{components,hooks,helpers}`, with the repo's file-role names. No barrel; consumers import through the export map.
- The web app's component rules apply here too: `Readonly<Props>`, router state only as props, no `useEffect` outside `use-*.ts` hooks, `useToday()` for dates.
- `apps/web/src/styles.css` scans this package with `@source`.
