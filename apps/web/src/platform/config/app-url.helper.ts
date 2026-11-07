export const LOCAL_APP_URL = 'http://localhost:3000'
// Google accepts only fixed redirect URIs, so preview sign-ins return through production (Better Auth oAuthProxy).
export const PRODUCTION_APP_URL = 'https://soonlane.com'
const PROXIED_ENVIRONMENTS = new Set(['production', 'preview'])

export interface DeploymentUrls {
	authUrl?: string
	vercelBranchUrl?: string
	vercelUrl?: string
}

function toHttpsUrl(host: string) {
	return `https://${host}`
}

// Previews have no AUTH_URL and fall back to Vercel's stable branch host, then the per-deployment host.
export function resolveBaseUrl({
	authUrl,
	vercelBranchUrl,
	vercelUrl,
}: DeploymentUrls): string {
	if (authUrl) return authUrl

	const host = vercelBranchUrl ?? vercelUrl

	return host ? toHttpsUrl(host) : LOCAL_APP_URL
}

// A preview answers on both its branch host and its deployment host, so both are trusted.
export function resolveTrustedOrigins(urls: DeploymentUrls): string[] {
	const vercelOrigins = [urls.vercelBranchUrl, urls.vercelUrl]
		.filter(host => host !== undefined)
		.map(toHttpsUrl)

	return [
		...new Set(
			[resolveBaseUrl(urls), ...vercelOrigins].map(url => new URL(url).origin)
		),
	]
}

/** Production must run the proxy too: it receives the Google callback for previews and forwards it. Local dev uses its own redirect URI. */
export function usesOAuthProxy(vercelEnv: string | undefined) {
	return vercelEnv !== undefined && PROXIED_ENVIRONMENTS.has(vercelEnv)
}
