import { getReleaseAnchor, RELEASES_URL } from '@soonlane/domain'
import { SITE_ORIGIN } from '@/modules/hosting/presentation/hosting.constants'

export const { APP_VERSION } = import.meta.env
export const { APP_COMMIT } = import.meta.env
/** On the public site; prereleases have no section on /changelog. */
export const RELEASE_NOTES_URL = APP_VERSION.includes('-')
	? RELEASES_URL
	: `${SITE_ORIGIN}/changelog#${getReleaseAnchor(APP_VERSION)}`
