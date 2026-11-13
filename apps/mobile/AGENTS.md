# apps/mobile agent rules

- Expo SDK 58 with Expo Router. Native builds run only on EAS: `bunx eas-cli@27.7.2 build --profile <development|development-simulator|preview|production>`. Never run `expo prebuild` into the repo; `ios/` and `android/` stay out of git.
- Route files in `app/` stay thin: a default export (Expo Router loads it) that reads route params with `useLocalSearchParams` and renders a screen from `src/modules/<module>/presentation/`. Everything under `src/` follows the repo's file-name rules.
- The root layout hands `rpcLink` (`src/platform/rpc/rpc.client.ts`) to `@soonlane/app` with `provideRpcLink` once, at module scope. The API origin is `EXPO_PUBLIC_API_URL`: the EAS build profile sets it, `.env.local` sets it for `bun run start` (see `.env.example`).
- From `@soonlane/app` import only files that need no DOM, TanStack Router or posthog-js; never `@soonlane/ui`, `@soonlane/auth/server` or another app ([ADR 0017](../../docs/decisions/0017-expo-mobile-app.md)).
- Style with `StyleSheet` and `src/tokens.gen.ts`, which `scripts/generate-tokens.ts` writes from `tooling/tailwind-config/tokens.css` and Tailwind's type scale on install, typecheck and start. Never type a color by hand. Text uses the iOS system font.
- `metro.config.js` resolves `react`, `react-native` and `@tanstack/react-query` from this app, so Bun's isolated install does not bundle a second copy.
- There is no `build` script: CI covers the app with `bun run check` and `bun run typecheck`. `bunx expo export --platform ios` is a local bundle check; delete its `dist/` afterwards.
