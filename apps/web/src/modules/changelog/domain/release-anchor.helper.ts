export function getReleaseAnchor(version: string) {
	return `v${version.replaceAll('.', '-')}`
}
