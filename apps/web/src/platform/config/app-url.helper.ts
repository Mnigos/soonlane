export const LOCAL_APP_URL = 'http://localhost:3000'

export interface DeploymentUrls {
	authUrl?: string
	vercelBranchUrl?: string
	vercelUrl?: string
}

function toHttpsUrl(host: string) {
	return `https://${host}`
}

// AUTH_URL wins; previews have no AUTH_URL and fall back to Vercel's stable branch host, then the per-deployment host.
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
