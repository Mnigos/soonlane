export const POOL_MAX_CONNECTIONS = 5
export const CONNECTION_TIMEOUT_MS = 5000
// Client-side bound, so a stuck query cannot outlive Vercel's maxDuration. statement_timeout is left out: pg sends it as a startup parameter, which the Neon pooler (PgBouncer) may reject.
export const QUERY_TIMEOUT_MS = 10_000
