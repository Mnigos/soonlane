# ADR 0010: Desktop Quick Add window, page messages and a Dock badge through AppKit

**Status:** Proposed
**Date:** 2026-11-06

## Context

The owner wants Todoist's Mac habits in the desktop app ([ADR 0004](0004-desktop-shell-with-electrobun.md)): ⌥Space opens Quick Add from any app, and the Dock icon counts the open tasks that are overdue or due today. Only the page knows that count, because "today" is the owner's local day read in the browser and the tasks come from the signed-in session. Until now nothing crossed from the page to the main process except blocked navigations ([ADR 0007](0007-desktop-sign-in-through-the-system-browser.md)).

What Electrobun 2.0.6 offers (read from the SDK in `apps/desktop/.hutch/devkit/api` and the native libraries in `~/.hutch/releases/electrobun/2.0.6`, not from memory):

- **Shortcut.** `GlobalShortcut.register(accelerator, callback)` returns whether it registered. The native side parses `alt`/`option` and `space` and watches keys with an NSEvent global monitor (`addGlobalMonitorForEventsMatchingMask:`). macOS delivers other apps' key presses to such a monitor only when the app has Accessibility access, and the key press still reaches the front app.
- **Windows.** `BrowserWindow` takes `titleBarStyle: 'hidden'` (no title bar), a `styleMask`, `setAlwaysOnTop` and `activate`. Its `ElectrobunWindow` class overrides `canBecomeKeyWindow`, so a window without a title bar still takes keyboard focus. `Screen.getAllDisplays()` gives each display's bounds and work area, and `Screen.getCursorScreenPoint()` gives the cursor in the same top-left coordinates.
- **Page messages.** The preload defines `window.__electrobunSendToHost(message)` on every page, remote pages included. It sends `JSON.stringify(message)`, and the main process emits `host-message` (and `host-message-<webviewId>`) with the parsed value in `data.detail`.
- **Dock.** Only `Utils.setDockIconVisible`. No badge API in the TypeScript SDK, and `libNativeWrapper.dylib` and `libElectrobunCore.dylib` export no badge symbol.
- **Threads.** The launcher (`main.js`) starts the app code with `new Worker(...)` and then blocks its main thread in `electrobun_core_run_main_thread`, the AppKit run loop. Bun code never runs on the main thread.

## Decision

- **Quick Add.** ⌥Space (`Alt+Space`, Todoist's default) opens a second window on `/app/quick-add`, a route next to the `/app` layout so the window has no sidebar: 600 × 136 points, no title bar, not resizable, always on top, centered on the display under the cursor with its top at a fifth of the work area. It uses the main window's preload and navigation rules (`openAppWindow`) and the same new-window and blocked-navigation handling (`followNavigation`). A **File › Quick Add** menu item with the same ⌥Space key equivalent covers presses while Soonlane is in front, which a global monitor never sees; both open Quick Add through the same handler. A press while it is open brings it forward. Presses are handled one at a time, so a double press opens one window. Its frame is not saved.
- **Accessibility.** After registering the shortcut, the app calls `AXIsProcessTrustedWithOptions` with the prompt option, so macOS asks the owner once per launch until access is granted. A shortcut another app holds, or missing access, only logs a warning.
- **Page messages.** The page sends two messages through `__electrobunSendToHost`, and only when `<html data-shell="desktop">` is set and the function exists. `{ type: 'quick-add-done' }` (a task was added, or Escape) closes the Quick Add window that sent it. `{ type: 'dock-badge', count }` sets the badge from any window. The main process decodes each with Effect Schema in the module's `domain/` and ignores anything else. The two shapes are written on both sides (`desktop-host.helper.ts` in the web shell module, the schemas in `apps/desktop`) instead of in a package, because two literals are smaller than a new dependency for the desktop app; a mismatch makes the main process ignore the message.
- **Badge count.** The web app subscribes to the TanStack Query cache once in `getRouter` (desktop shell only). Whenever the Today list for the local today (`tasks.list` with `{ from: today, to: today, today }`, the Today page's query) gets new data, optimistic updates included, it reports `overdue + scheduled`. When that list leaves the cache, as on sign-out (`queryClient.clear()`), it reports 0. `useDockBadgeQuery` keeps the list loaded in the shell and in Quick Add, so invalidations refetch it and the local day change starts a new query. No endpoint and no server clock.
- **Dock badge.** `AppKitDockBadgeLive` implements the `DockBadge` port through `bun:ffi` and the Objective-C runtime (`platform/macos/objc.helper.ts`). It builds an `NSInvocation` of `[NSApplication setValue:label forKeyPath:@"sharedApplication.dockTile.badgeLabel"]` and sends it `performSelectorOnMainThread:withObject:waitUntilDone:NO` with `invoke`, so key-value coding reads `NSApp` and its Dock tile and sets the label on the main thread. Zero sends a nil label, which hides the badge.
- **Signed out.** `/app/quick-add` runs its guard in the browser (`ssr: false`). A signed-out Quick Add sends `quick-add-done` and closes, leaving the main window with the login screen; a browser goes to `/login`. Outside the desktop app the page adds a task and then opens `/app`.

## Consequences

- ADR 0007's "no other message crosses between the page and the main process" no longer holds. The sign-in contract stays in `@soonlane/auth`; Quick Add and the badge use the two messages above. A third message, or one with a richer payload, is the point to move the shapes into a package.
- Inside Soonlane the menu item consumes ⌥Space. Electrobun's monitor does not: in a text field of another app the key press also types a non-breaking space, until a Carbon hot key replaces the monitor. Todoist uses a Carbon hot key, which consumes it. Electrobun offers no other route, and registering one from the Bun worker is untested ([SOON-58](https://linear.app/rigtch/issue/SOON-58)).
- Accessibility access belongs to one signed binary. Each unsigned dev build, and a copy in a new path, asks again. `bun run dev` from a terminal that has the access inherits it.
- Showing Quick Add activates the app, so macOS brings the main window forward behind it, and after Quick Add closes the main window stays in front. Todoist uses a non-activating panel; `ElectrobunWindow` is an `NSWindow`, so `NonactivatingPanel` has no effect.
- Each press loads `/app/quick-add` from the web app, so the window shows its background until the page renders.
- The two windows keep separate query caches. A task added in Quick Add appears in the main window's lists after their next refetch (a visibility change, a change made there, or a remount after the 30 s stale time). The badge updates at once, because Quick Add reports before it closes: the cache listener runs synchronously inside the create mutation's invalidation, before the composer's `onCreated` sends `quick-add-done`.
- The date picker opens inside the 136-point window and scrolls there.
- The badge follows the local day through `useToday` (midnight timer and `visibilitychange`). A midnight that passes while the Mac sleeps updates the badge on the next visibility change or task change.
- The worker thread only builds the invocation (in its own autorelease pool, with the signature taken from `NSObject`); it sends no AppKit method, and retaining the `NSApplication` class as the target is a no-op.
- The shortcut is unregistered when the runtime's scope closes. At quit the process ends and the NSEvent monitor ends with it, so nothing outlives the app.
- Rejected: a badge endpoint or a server-side count (the server cannot know the local day), Electrobun RPC for the two messages (it needs typed handlers on both sides for two fire-and-forget messages), a hidden Quick Add window kept between presses (out of scope, and it would keep a second page and its queries alive), and a new desktop bridge package for two literals.

## Related

- `apps/desktop/src/modules/quick-add`, `apps/desktop/src/modules/dock-badge`, `apps/desktop/src/platform/macos/objc.helper.ts`, `apps/desktop/src/modules/window/infrastructure/app-window.helper.ts`
- `apps/web/src/modules/tasks/presentation/routes/quick-add.route.tsx`, `apps/web/src/modules/tasks/presentation/helpers/dock-badge.helper.ts`, `apps/web/src/modules/shell/presentation/helpers/desktop-host.helper.ts`
- [ADR 0004](0004-desktop-shell-with-electrobun.md), [ADR 0005](0005-desktop-app-layout.md), [ADR 0007](0007-desktop-sign-in-through-the-system-browser.md)
- `ARCHITECTURE.md`: Desktop app
