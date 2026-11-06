# ADR 0005: The desktop app's modules and Effect runtime

**Status:** Accepted
**Date:** 2026-11-06

## Context

The first desktop shell ([ADR 0004](0004-desktop-shell-with-electrobun.md)) was one `main.ts` with flat helpers. The next PRs add sign-in through a deep link, a global quick-add shortcut, a Dock badge and updates. Each needs Electrobun events, state and error handling. Growing the flat file would mix them, and its rules would drift from the web app's (ADR 0001).

## Decision

- `apps/desktop/src` follows the web app's layout and Effect 4 conventions. `main.ts` only builds the layers. `platform/` holds `AppLive` (`app.layers.ts`), the one `ManagedRuntime` (`app.runtime.ts`), `DesktopConfig` (`SOONLIST_URL` through Effect `Config`, which accepts only `http` and `https` URLs) and `electrobun/electrobun-events.helper.ts`. That helper turns Electrobun's event emitter into scoped listeners and streams.
- Feature code lives in `modules/<module>/` with `domain/` (pure: origin rules, frame checks, Schema decoding of event payloads; no Electrobun and no services), `application/` (ports and services), and `infrastructure/` (Electrobun adapters and the layers that subscribe to events). This PR has three modules: `window` (main window, frame persistence), `navigation` (navigation rules, will-navigate and new-window handling, system browser) and `menu` (app menu).
- An Electrobun API used by one module stays in that module's `infrastructure/`. Only the event helper, which every module uses, lives in `platform/`.
- The file-role lint rules and the no-barrel rule cover `apps/desktop/src`; `main.ts` is the one entry exempt from a role suffix, because the Electrobun config names it.
- A new module or package appears only with the PR that needs it.

## Consequences

- Event payloads are decoded with Effect Schema rather than read field by field, and a handler that fails is logged without stopping later events.
- The close-time frame save runs synchronously inside Electrobun's close callback, because the app quits right after its last window closes. A stream would not get to run.
- A link from a new-window request loads in the window only when it has the app's exact origin. Other web and mail links go to the system browser, and other schemes open nowhere.
- `effect` is a runtime dependency of the desktop bundle (about 1.3 MB of main-process JavaScript, not shipped to the page).

## Related

- `apps/desktop/src/platform/app.layers.ts`, `apps/desktop/src/modules/*`
- [ADR 0001](0001-naming-and-layering-conventions.md), [ADR 0004](0004-desktop-shell-with-electrobun.md)
