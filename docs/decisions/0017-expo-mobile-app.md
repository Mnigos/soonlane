# ADR 0017: An Expo mobile app with native screens, signed in through Better Auth's Expo plugin

**Status:** Proposed
**Date:** 2026-11-13

## Context

Soonlane runs in the browser and in the desktop app, which is moving to a UI of its own built from screens shared with the web app ([ADR 0015](0015-desktop-app-with-its-own-ui.md)). There is no phone app. On 2026-11-12 Igor asked for one, for iPhone first and Android later (project [Mobile app](https://linear.app/rigtch/project/mobile-app-ad590444ffc8), whose description holds the technical brief).

Facts this decision rests on:

- **Shared code.** `@soonlane/app` holds the screens and the data logic both browser apps use: queries, mutations with optimistic updates, and cache keys through `orpcQuery`. A host app hands over its oRPC link once with `provideRpcLink`. The screens are DOM components on `@soonlane/ui`. Most hooks need only `@soonlane/contracts`, `@soonlane/domain` and TanStack Query, but several import `sonner` for toasts or `@soonlane/analytics/client` (posthog-js), and `useToday` listens for `visibilitychange` on `document`.
- **API.** The API's CORS (`withCors`) and the RPC handler refuse an `Origin` that is neither in `TRUSTED_ORIGINS` nor the desktop app's bundled page, but pass a request without one. React Native's `fetch` sends no `Origin`.
- **`@better-auth/expo` 1.7.22** (read from the published package, not from memory) needs `better-auth` ^1.7.22 (the lockfile has 1.7.18, so the server change bumps it) and `expo-linking`, `expo-web-browser`, `expo-secure-store`, `expo-constants` and `expo-network`. Its server plugin, after the OAuth callback, copies the response's whole `Set-Cookie` into the redirect as `?cookie=…`, but only when the redirect goes to a trusted address that is not `http:` or `https:`. It turns an `expo-origin` header into `Origin` when a request has none, and trusts `exp://` in development. Its client opens the sign-in with `expo-web-browser`'s `openAuthSessionAsync`, keeps the cookie in `expo-secure-store` (the iOS Keychain) and sends it as a `Cookie` header with `credentials: 'omit'`. From ordinary responses, such as a refreshed session, it keeps the `Set-Cookie` only when at least one cookie name in it starts with its `cookiePrefix` option (default `better-auth`), and it looks up the OAuth state cookie under that prefix.
- **iOS.** `openAuthSessionAsync` uses `ASWebAuthenticationSession`, which returns the callback only to the app that opened it.
- **The desktop app** cannot use the same mechanism. Electrobun 2.0.6 registers URL schemes only on macOS, any Mac app can claim `soonlane://`, Electrobun writes every loaded URL to the unified log ([ADR 0007](0007-desktop-sign-in-through-the-system-browser.md)), the plugin adds no cookie to an `http://127.0.0.1` return, and a page in a webview cannot set a `Cookie` header.

## Decision

Igor decided on 2026-11-12:

- **Expo with native screens.** The mobile app is an Expo (React Native) app with screens written for the phone. It does not load the web app in a webview and does not reuse the DOM screens of `@soonlane/app`.
- **iOS first.** Android starts once the iPhone app is in TestFlight.
- **Better Auth on both native apps, one plugin each.** The mobile app signs in with the official `@better-auth/expo` plugin: Google in the iOS system sign-in sheet, the return through `soonlane://`, and the session cookie in the Keychain. The desktop app keeps the `bearer` plugin and the PKCE-bound code of ADR 0015 (SOON-148), for the reasons above.
- **Shared data logic, native screens.** The mobile app uses the queries, mutations, optimistic updates and cache keys of `@soonlane/app`, and provides its own oRPC link with `provideRpcLink`. Before it can, the browser-only parts of the shared hooks (toasts and browser analytics) move behind the host app, as the oRPC link did (SOON-165).
- **EAS.** Builds and store uploads run on Expo Application Services. Igor's Apple Developer account signs the builds for TestFlight.

Defaults from the project brief, to which Igor has not objected:

- **Place in the repo.** The app lives in `apps/mobile` and depends on `@soonlane/contracts`, `@soonlane/domain` and the DOM-free hooks and helpers of `@soonlane/app`. It never imports another app, `@soonlane/ui`, `@soonlane/auth/server` or anything server-only, and it builds its own Better Auth client with the Expo client plugin instead of `@soonlane/auth/client`. `@soonlane/app` keeps its rules from ADR 0015; any file the mobile app imports needs no DOM, no TanStack Router and no posthog-js.
- **Look.** The app follows `DESIGN.md`: the dark theme and the same tokens.
- **Styling is left to the spike.** Whether screens use NativeWind or `StyleSheet` with values taken from `tooling/tailwind-config/tokens.css` depends on what the spike (SOON-164) finds about Metro and the repo's Tailwind 4 setup. The ticket that creates the app (SOON-167) records the choice. Either way the colors come from the one token file, never from a second copy typed by hand.
- **Today** is the phone's local calendar day, as it is the browser's on the web.
- **Review.** The council reviews the server's sign-in change (SOON-166), because it adds a way into a session.
- **Analytics** only after the user's consent, with the same events as the web app.
- **Copy.** Gemini 4 Carbon writes the UI copy.
- **Changelog.** User-facing mobile changes use a new product scope, `mobile`.
- **Not in the first version:** offline use (SOON-31) and reminders (SOON-25).

## Consequences

- `createAuth` gains `expo()` (SOON-166). `soonlane://` becomes a sign-in return address for Better Auth and for the `returnAddresses` plugin, which today accepts only absolute URLs on a `TRUSTED_ORIGINS` origin and rejects a custom scheme, whose URL origin is `null`. `TRUSTED_ORIGINS` and the browser CORS stay as they are. `exp://` is trusted only in development.
- The `soonlane://` redirect carries a working session cookie. On iOS the sign-in sheet hands it only to the app that opened it, but `/expo-authorization-proxy` sets the OAuth state cookie in whichever browser opens it, so a sign-in someone else started can end in a plain browser and open `soonlane://` there. On macOS and Android any app can register the scheme. The council checks this path and its guard in SOON-166, and Android (stage E) revisits it before release.
- The app's Better Auth client gets the environment's cookie prefix (`soonlane`, `soonlane-staging`). With the default prefix it would keep the cookie from the sign-in but drop every refreshed session cookie. Its oRPC link sends the same cookie header the Better Auth client sends.
- A mobile session is a normal Better Auth session created through Google, so account deletion's fresh-session check ([ADR 0009](0009-open-sign-in.md)) applies as in the browser. Signing out in the app leaves the browser signed in.
- `@soonlane/app` gains a third host app that renders none of its screens. Moving browser-only code behind the host app changes the shared hooks' signatures for the web and desktop apps too, and `useToday` needs a trigger other than `document` on the phone, such as the app returning to the foreground.
- The mobile app, like the bundled desktop UI, can be older than the API, and store review slows updates further. It reads the API's oldest supported version from SOON-152, so contracts keep changing additively.
- The spike (SOON-164) settles what breaks under Metro and Hermes: workspace resolution with Bun, Zod 4 and the contracts on Hermes, and one React version for the app and the shared hooks.
- `ARCHITECTURE.md` describes `apps/mobile` in its layout once the app exists (SOON-167). `cliff.toml` and the agent rules list `mobile` as a product scope from this change on.
- Rejected:
  - A webview that loads the web app or its screens. Igor asked for native screens.
  - Shared DOM components inside the native app. Expo renders them in a webview, so each screen would again be a web page.
  - `bearer` on mobile. The app would need a code exchange of its own, like the desktop app's, and the Expo plugin with the iOS sign-in sheet already covers that step.
  - The Expo mechanism on desktop. The plugin adds `?cookie=` only to a redirect that is not `http:` or `https:`, so the loopback return gets no cookie. Electrobun registers `soonlane://` only on macOS, where any app can claim it, and it writes every URL a window loads to the unified log. A webview page cannot send the stored cookie as a `Cookie` header.

## Update 2026-11-13 (SOON-167)

Styling uses React Native's `StyleSheet`, not NativeWind. `apps/mobile/scripts/generate-tokens.ts` writes `src/tokens.gen.ts` (gitignored) from `tooling/tailwind-config/tokens.css` and Tailwind's type scale on install, typecheck and start, so the colors still come from the one token file. On SDK 58 Babel keeps classes native, so oRPC's classes need no `noClassCalls` assumption.

## Related

- [ADR 0007](0007-desktop-sign-in-through-the-system-browser.md), [ADR 0009](0009-open-sign-in.md), [ADR 0013](0013-three-hosts-on-railway.md), [ADR 0015](0015-desktop-app-with-its-own-ui.md)
- Linear: SOON-30 and SOON-164 to SOON-178 in the Mobile app project
- `ARCHITECTURE.md`: Package layering, Sign-in; `UBIQUITOUS_LANGUAGE.md`: Host app, Mobile app
