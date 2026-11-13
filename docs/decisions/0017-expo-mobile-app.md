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

## Update 2026-11-13 (SOON-166)

The council reviewed the server change.

- **Proxy guard.** `/expo-authorization-proxy` signs the OAuth state into whichever browser opens it, and Better Auth's state row does not say which flow wrote it. A before hook in `createAuth` lets the proxy through only for one Google authorization URL whose state row is pending, has no `link`, and returns only to an app scheme (`callbackURL`, and `newUserURL` and `errorURL` when set). Without it, a Todoist link someone else started could be planted in another browser and link that person's Todoist to the starter's account. `returnAddresses` accepts the app's schemes only on `/sign-in/social`, never on `/link-social`.
- **A sign-in someone else started.** The proxy still completes a Google sign-in started by another person in the opener's browser, which then hands the session cookie to whichever app handles `soonlane:` on that device. A server-side binding cannot close this, nor can a code exchange like the desktop's, because the person who started the flow holds every value the app would hold. For iOS this is accepted as residual risk: it needs an app that claims `soonlane:` on the victim's phone. Android's release depends on a new review, likely with App Links.
- **Shared scheme with the desktop app.** Both apps use `soonlane://`. The iPhone app must not be offered on Apple Silicon Macs, or the desktop app first moves to the loopback return of ADR 0015, so two apps on one Mac never claim the scheme.
- **Login CSRF through the proxy.** Someone could start an app sign-in, complete it with their own Google account to get a code, then send another person's browser through the proxy and on to the callback with that code, which signed that browser into the first account. `expoSignIn` drops every `Set-Cookie` from a callback that redirects to an app scheme, after the plugin has copied them into `?cookie=`, so the browser gets no session.
- **For SOON-168.** The app takes a session only from the result of its own auth session (`openAuthSessionAsync`) and never from a `cookie` parameter on any other incoming link. It strips that parameter from incoming links before routing, analytics or error reporting see them, and decides whether the sign-in sheet uses `preferEphemeralSession`, so it does not share cookies with Safari.
- **No plugin `init`.** `createAuth` drops the plugin's `init`, which trusts `exp://` when `NODE_ENV` is `development`. `APP_ENV`, not `NODE_ENV`, decides whether Expo Go is trusted. Railpack builds with `NODE_ENV=production` by default, so this keeps local and Railway builds consistent rather than closing a live hole.

## Update 2026-11-13 (SOON-168)

- **Incoming links.** `app/+native-intent.tsx` is the only code that handles incoming URLs. It keeps only the route and drops every query and fragment, and a link with `cookie` anywhere in it (path, query or fragment), in any spelling or encoding, opens the start screen. An SDK added later (analytics, crash reporting) runs with deep-link and app-open URL capture off and gets `user.id` at most, never the session object, which holds the session token.
- **Sign-out.** Sign-out always succeeds on the phone. When its request fails, offline or with an error, the server session stays valid until it expires, at most 7 days later, and the phone no longer holds its token. A reply to a request that a sign-out overtook is dropped before it can store a session, and no sign-in starts until the sign-out settles.
- **Session refresh.** The mobile app's API calls send `x-soonlane-app: mobile`, and the API never refreshes the session on them. Only the auth client's `/get-session` does, and the Expo plugin stores that reply's cookie. Better Auth's `deferSessionRefresh` stays off: with it, a refresh reply the sign-out guard drops would put the signed-out user's session back.

## Update 2026-11-13 (SOON-173)

- **Account deletion.** Settings shows the user's name, email and the app's version, and deletes the account through Better Auth's `/delete-user`, as the web does ([ADR 0009](0009-open-sign-in.md)). A destructive alert stands in for the web's dialog. When the server answers `SESSION_EXPIRED`, the app opens the Google sign-in sheet with the user's address as `login_hint` and with `prompt=login` and `max_age=0`, then asks again only when that sheet signed in the same user. The user can pick another Google account there; then nothing is deleted and an alert says which account is now signed in. When the server cannot say whom the sheet signed in, the app signs out, so no screen names one user while the Keychain holds another, and an alert says the deletion could not be confirmed, since no session also follows an expiry, a revocation or a deletion elsewhere.
- **Boundary.** The deletion runs inside the sign-out boundary: replies to requests sent before or during it are dropped and no sign-in starts until it settles. Sign-outs and deletions run one after another, each in its own boundary. Inside it, the app first asks `/get-session` with the same credential and sends `/delete-user` only when that names the user the confirmation named; when it names someone else, an alert names both accounts. It counts only a `User deleted` reply as a deletion, or a credential the server no longer knows after this app sent `/delete-user` for that user and lost the reply. Either way the app then signs out exactly as Sign out does, so the Keychain and the query cache are cleared. A credential the server no longer knows for any other reason, such as an expired session, also signs the phone out, with an alert that the account was not deleted. A failed or refused deletion leaves the session as it was.

## Related

- [ADR 0007](0007-desktop-sign-in-through-the-system-browser.md), [ADR 0009](0009-open-sign-in.md), [ADR 0013](0013-three-hosts-on-railway.md), [ADR 0015](0015-desktop-app-with-its-own-ui.md)
- Linear: SOON-30 and SOON-164 to SOON-178 in the Mobile app project
- `ARCHITECTURE.md`: Package layering, Sign-in; `UBIQUITOUS_LANGUAGE.md`: Host app, Mobile app
