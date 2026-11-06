# packages/ui agent rules

- App-agnostic primitives only: no router, TanStack Query, oRPC, Effect or domain types. A primitive that needs routing exposes classes (`sidebarItemVariants`) for the app's `Link`.
- Components in `src/components/*.tsx`, imported per file (`@soonlane/ui/components/<name>`, `@soonlane/ui/cn`); no barrel, no default exports.
- Use CVA for variants, `cn` for class merging, and the tokens from `tooling/tailwind-config`; no hard-coded colors.
- `apps/web/src/styles.css` scans this package with `@source`.
