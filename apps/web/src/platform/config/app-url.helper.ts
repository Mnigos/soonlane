export const LOCAL_APP_URL = 'http://localhost:3000'
const PROXIED_ENVIRONMENTS = new Set(['production', 'preview'])

export interface DeploymentUrls {
	/** Production's URL (`APP_URL`), or the dev server locally. */
	appUrl: string
	vercelEnv?: string
	vercelBranchUrl?: string
	vercelUrl?: string
}

function toHttpsUrl(host: string) {
	return `https://${host}`
}

/** Production and local runs serve `APP_URL`; a preview serves its own Vercel host, the stable branch host first. */
export function resolveBaseUrl({
	appUrl,
	vercelEnv,
	vercelBranchUrl,
	vercelUrl,
}: DeploymentUrls): string {
	const host = vercelBranchUrl ?? vercelUrl

	return vercelEnv === 'preview' && host ? toHttpsUrl(host) : appUrl
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
