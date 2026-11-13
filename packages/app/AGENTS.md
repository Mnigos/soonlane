# packages/app agent rules

- Screens both host apps render, the web app and the desktop app ([ADR 0015](../../docs/decisions/0015-desktop-app-with-its-own-ui.md)). Routes, loaders, layouts and anything from `@tanstack/react-start` stay in the host apps and render these screens.
- Never import an app, `@soonlane/auth` or server code, nor Effect, TanStack Start, `@soonlane/db` and `@soonlane/auth/server` (those four lint-enforced). It may import `@soonlane/ui`, `@soonlane/domain`, `@soonlane/contracts`, `@soonlane/analytics`'s types and cookie entry, TanStack Query and TanStack Router.
- Call the API through `orpcQuery` (`@soonlane/app/rpc-query`). The host app hands over its oRPC link once at startup with `provideRpcLink`; the link keeps any per-visitor state.
- Toasts, analytics events, the app resuming and the desktop app's Quick Add and Dock badge messages (`sendToDesktop`, which only the desktop app provides) go through `getHostPorts()` (`@soonlane/app/host-ports`), which the host app fills once at startup with `provideHostPorts`; never import `sonner` or `@soonlane/analytics/client` here.
- The data hooks and helpers the mobile app uses (task, label and project queries and mutations, their helpers, `useToday`) stay DOM-free: no DOM globals, `@soonlane/ui`, TanStack Router, `react-dom`, `lucide-react` or `.tsx` imports, directly or through another file ([ADR 0017](../../docs/decisions/0017-expo-mobile-app.md)).
- What only the host knows (the user menu with sign-out and account actions, the home path, build info, the release notes link) comes from `useHostApp()`; the host renders `HostAppContext` around the screens.
- Link to app views only through `APP_PATHS`, which both host apps' route trees serve.
- Lay out code like the web app's `presentation/` folders: `src/modules/<module>/{components,hooks,helpers}`, with the repo's file-role names. No barrel; consumers import through the export map.
- The web app's component rules apply here too: `Readonly<Props>`, router state only as props, no `useEffect` outside `use-*.ts` hooks, `useToday()` for dates.
- `apps/web/src/styles.css` scans this package with `@source`.
