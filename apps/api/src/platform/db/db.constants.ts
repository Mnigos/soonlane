/** One long-lived process holds the pool; a deploy briefly runs two, which stays well under Postgres' default 100 connections. */
export const POOL_MAX_CONNECTIONS = 10
export const CONNECTION_TIMEOUT_MS = 5000
/** Client-side bound, so a stuck query cannot hold a request and a pooled connection open. statement_timeout is left out: pg sends it as a startup parameter, which the Neon pooler (PgBouncer) may reject. */
export const QUERY_TIMEOUT_MS = 10_000
