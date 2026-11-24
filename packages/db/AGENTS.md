# packages/db agent rules

- Tables in `schema/[name].schema.ts`, re-exported from `schema/index.ts`; brand UUID keys with `$type<UserId>()`; always declare `onDelete`.
- Never edit a generated migration; change the schema and run `bun run db:generate`. Deployed migrations are immutable.
- Server-only: never import `@soonlane/db` from browser code.
- Better Auth owns `user`, `session`, `account` and `verification`, and its OAuth provider and `jwt` plugins own the tables in `schema/oauth.schema.ts`; change them only together with `packages/auth`, following the plugins' fields. The one Soonlane column there is `oauth_consent.last_used_at`, which the API's `mcp` module writes from MCP requests and the plugins never read.
- Data backfills are scripts in `scripts/`, not migrations; they connect like `migrator.helper.ts` (`DATABASE_URL`) and default to a dry run.
