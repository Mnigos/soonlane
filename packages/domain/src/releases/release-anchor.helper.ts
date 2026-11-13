/** The `/changelog` section of a stable release (`v1-2-0`), which the app's release notes link opens. */
export function getReleaseAnchor(version: string) {
	return `v${version.replaceAll('.', '-')}`
}
