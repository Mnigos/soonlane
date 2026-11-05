# packages/ui agent rules

Rules for reusable UI primitives: CVA variants, Tailwind classes and package exports. Root `AGENTS.md` still applies; read at least 3 similar component files before editing.

## Working Rules

- Components are bare kebab-case `.tsx` files in `src/components/`, exported as named functions; no default exports.
- Consumers import concrete files through the export map: `@soonlist/ui/components/<name>` and `@soonlist/ui/cn`. No barrel.
- Use `ComponentProps<'element'>` for native props, `Readonly<ComponentNameProps>` for component props, and `PropsWithChildren` for children.
- Use CVA for meaningful variants and export the variants helper when consumers need it (`buttonVariants`, `sidebarItemVariants`).
- Use `cn()` from `src/utils/cn.util.ts` for class merging.
- Use the tokens from `tooling/tailwind-config/tokens.css` (`bg-sidebar`, `text-danger`, `text-muted-foreground`); never hard-coded colors or arbitrary values.
- Prefer `size-*` over paired `h-* w-*`.

## Common Decisions

- Keep reusable, app-agnostic primitives here; feature components (day sections, week strip, user menu) stay in `apps/web/src/modules/*/presentation/components`, and the app shell stays in `apps/web/src/components/app-shell`.
- No router, TanStack Query, oRPC, Effect or domain types in this package. A primitive that needs routing exposes classes (`sidebarItemVariants`) for the app's `Link`.
- Add a primitive here only when it is generic; one feature-specific consumer is not enough to promote app code.
- For visual work, follow `DESIGN.md` and use `impeccable`.

## Verification

- `bun run typecheck`, `bun run check:fix`, `bun run test` (project `@soonlist/ui`; specs render with `react-dom/server` and assert with cheerio).
- `apps/web/src/styles.css` scans this package with `@source`; after adding classes, run `bun run build` and check they reach the CSS.
- For visible changes, capture desktop and mobile screenshots of the running app.
