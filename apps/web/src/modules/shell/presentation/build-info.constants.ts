import { getReleaseAnchor } from '@/modules/changelog/domain/release-anchor.helper'
import { RELEASES_URL } from '@/modules/site/presentation/site.constants'

export const { APP_VERSION } = import.meta.env
export const { APP_COMMIT } = import.meta.env
// Prereleases have no section on /changelog.
export const RELEASE_NOTES_URL = APP_VERSION.includes('-')
	? RELEASES_URL
	: `/changelog#${getReleaseAnchor(APP_VERSION)}`
