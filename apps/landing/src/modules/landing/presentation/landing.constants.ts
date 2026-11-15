import type { LinkProps } from '@tanstack/react-router'

/** Fixed, so previews and other hosts never compete with soonlane.com. */
export const LANDING_URL = 'https://soonlane.com'
export const SITE_NAME = 'Soonlane'
export const GITHUB_URL = 'https://github.com/Mnigos/soonlane'
export const LICENSE_URL = `${GITHUB_URL}/blob/main/LICENSE`
export const CONTACT_EMAIL = 'hello@soonlane.com'
export const DEFAULT_OG_IMAGE = '/og/default.png'
export const DATE_FORMAT = new Intl.DateTimeFormat('en-GB', {
	day: 'numeric',
	month: 'short',
	year: 'numeric',
	timeZone: 'UTC',
})

interface LandingPageLink {
	label: string
	to: LinkProps['to']
}

export const LANDING_PAGE_LINKS: readonly LandingPageLink[] = [
	{ label: 'Blog', to: '/blog' },
	{ label: 'Changelog', to: '/changelog' },
]
