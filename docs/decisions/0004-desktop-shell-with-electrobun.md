# ADR 0004: A macOS desktop shell with Electrobun that loads the hosted web app

**Status:** Accepted
**Date:** 2026-11-06

## Context

The owner wants Soonlist as a Mac app: its own window and Dock icon, later a global quick-add shortcut, a Dock badge with today's count and signed releases with auto-update. The web app already is the product, so the desktop app should not fork the UI. Apple Silicon comes first; the owner has an Apple Developer account for signing later.

What Electrobun 2.0.6 provides (read from `docs.electrobun.dev` and the SDK that Hutch projects into `apps/desktop/.hutch/devkit`, not from memory):

- **Packaging.** `electrobun` on npm is only a bootstrap. It downloads the Hutch toolchain (Hutch 0.29.0, Cottontail 0.7.3, Bun 1.4.4 for the main process, about 235 MB in `~/.hutch`) and projects the TypeScript SDK into `.hutch/devkit`. Imports resolve there through tsconfig `paths`, not `node_modules`. Its devkit tsconfig uses `baseUrl`, which TypeScript 7 rejects, so `apps/desktop/tsconfig.json` sets its own `paths`.
- **Window.** `BrowserWindow({ url })` loads any `https` or `http` URL. `titleBarStyle: 'hiddenInset'` keeps the traffic lights over the content. Frames are not persisted for us, but `resize`, `move` and `close` events and `Screen.getAllDisplays()` exist.
- **Renderer.** macOS uses the system WKWebView by default. CEF (Chromium) can be bundled with `bundleCEF`, at roughly 100 MB more.
- **Detection.** There is no API for a custom user agent. A `preload` script (inline JavaScript) runs at document start on every page, remote pages included, before the page's own scripts.
- **Navigation.** `setNavigationRules(['^*', 'https://origin/*'])`: `^` blocks, the last matching rule wins, and no match allows. A blocked navigation still emits `will-navigate` with `{ url, allowed: false }`. `target=_blank`, `window.open` and Cmd+click emit `new-window-open`. `Utils.openExternal` opens the system browser. In 2.0.6 the `navigationRules` window option is ignored for the main view (`createWebview` never receives it), so the rules are set on the view after creation.
- **Drag regions.** These need the full (non-sandboxed) preload. It reads `-webkit-app-region` by rewriting stylesheets it can fetch as CSS, which fails for Vite's dev CSS modules, or by reading the `--electrobun-app-region` custom property directly.
- **Later PRs.** `app.urlSchemes` plus the `open-url` event provide deep links (macOS only, and the app must be in `/Applications`). `build.mac.codesign`, `notarize` and `createDmg` handle signing, `Updater` with `release.baseUrl` handles updates over `dev`/`canary`/`stable` channels, and `GlobalShortcut` exists. A `stable` build makes a self-extracting `.app` and a `.dmg` (32 MB each). On its first launch the app unpacks itself in place (91 MB) and writes an uninstaller to `~/Library/Application Support/<identifier>/stable`.

## Decision

- `apps/desktop` (`@soonlist/desktop`, private, AGPL) is an Electrobun app with a Bun main process. It pins `electrobun` 2.0.6 exactly and takes its version from the root `version.json`.
- The window loads `SOONLIST_URL`, which defaults to `https://soonlist.vercel.app`; `bun run dev` uses `http://localhost:3000`. It keeps the native WKWebView renderer and no bundled UI.
- Navigation rules keep the window on the web app's origin. Every other top-level navigation, `target=_blank` link and `window.open` goes to the system browser.
- The shell marks the page with an inline preload: `<html data-shell="desktop">`. The web app reacts only through the Tailwind `desktop:` variant, which adds room and a drag strip under the traffic lights and swaps the Google button for a short "desktop sign-in is coming" note. No user-agent sniffing.
- The webview is not sandboxed, because drag regions need the full preload. Only the owner's own origin can load in it, and the main process registers no RPC handlers.
- The window frame is saved to `window-state.json` in the app's data folder and is ignored when it no longer overlaps a display.
- CI builds the unsigned app on `macos-15` (arm64) for pull requests that touch `apps/desktop` and uploads the `.dmg` and `.app.tar.zst` as a workflow artifact. The check job projects the SDK first, so type-aware lint can resolve `electrobun`.

## Consequences

- Google OAuth refuses embedded webviews, so the Google page cannot be used inside the window. Sign-in moves to the system browser and returns through a `soonlist://` deep link in the next PR. Until then the desktop login screen says so, and any stray navigation to Google opens in the browser.
- Web and desktop ship together: a web deploy updates the desktop UI with no app release. The shell itself changes rarely.
- WKWebView follows the installed macOS Safari engine, not a pinned Chromium; CEF stays available if that becomes a problem.
- The Hutch toolchain is a second runtime download in CI and on first use (about 9 s when not cached).
- Rejected: Tauri, which needs Rust for the native side and has the same WKWebView. Electron, which bundles Chromium (about 100 MB more per app) and a Node main process. A bundled copy of the web UI, which needs a second build and an API origin decision and can drift from the web app.

## Related

- [ADR 0005](0005-desktop-app-layout.md): the modules and Effect runtime inside `apps/desktop/src`
- `apps/desktop/src/modules/window`, `apps/desktop/src/modules/navigation`, `tooling/tailwind-config/theme.css` (`desktop:` variant, `app-drag`)
- Electrobun docs: https://docs.electrobun.dev/electrobun/apis/browser-window/, https://docs.electrobun.dev/electrobun/apis/browser-view/
