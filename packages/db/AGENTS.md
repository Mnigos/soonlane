# packages/db agent rules

- Tables in `schema/[name].schema.ts`, re-exported from `schema/index.ts`; brand UUID keys with `$type<UserId>()`; always declare `onDelete`.
- Never edit a generated migration; change the schema and run `bun run db:generate`. Deployed migrations are immutable.
- Server-only: never import `@soonlist/db` from browser code.
- Better Auth owns `user`, `session`, `account` and `verification`; change them only together with `packages/auth`.
- Data backfills are scripts in `scripts/`, not migrations; they connect like `migrator.helper.ts` (`DATABASE_URL_UNPOOLED` first) and default to a dry run.
