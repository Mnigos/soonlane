/** User-Agent Client Hints, which only Chromium browsers expose. */
interface ClientHintsNavigator extends Navigator {
	userAgentData?: { mobile: boolean; platform: string }
}

const PHONE_OR_TABLET_PATTERN = /android|iphone|ipad|ipod/iu

/** Whether this browser runs on macOS, the desktop app's one platform; iPadOS also claims `Macintosh` but reports touch points. */
export function isDesktopAppBrowser() {
	const { userAgent, maxTouchPoints, userAgentData }: ClientHintsNavigator =
		navigator

	return (
		userAgent.includes('Macintosh') &&
		!PHONE_OR_TABLET_PATTERN.test(userAgent) &&
		maxTouchPoints === 0 &&
		(!userAgentData ||
			(!userAgentData.mobile && userAgentData.platform === 'macOS'))
	)
}
