/** The Allow page's path prefix, in the one spelling `vite.config.ts` serves with `no-store`. */
export const MCP_PAGE_PREFIX = '/mcp/'
/** Set on every response under the prefix, an error page included: the request names an agent and where it returns, which no referrer may carry to another site, and no frame may trick a click on Allow. */
export const MCP_PAGE_HEADERS = {
	'Referrer-Policy': 'no-referrer',
	'Content-Security-Policy': "frame-ancestors 'none'",
	'X-Frame-Options': 'DENY',
}
/** The Allow page's one column; an unbroken agent name or host wraps instead of widening the page. */
export const ALLOW_PAGE_CLASS =
	'mx-auto flex min-h-dvh max-w-sm flex-col justify-center gap-8 px-6 py-16 wrap-anywhere'
