import type { LinkProps } from '@tanstack/react-router'

/** Fixed, so previews and other hosts never compete with soonlane.com. */
export const SITE_URL = 'https://soonlane.com'
export const SITE_NAME = 'Soonlane'
export const GITHUB_URL = 'https://github.com/Mnigos/soonlane'
export const LICENSE_URL = `${GITHUB_URL}/blob/main/LICENSE`
export const RELEASES_URL = `${GITHUB_URL}/releases`
export const CONTACT_EMAIL = 'hello@soonlane.com'
export const DEFAULT_OG_IMAGE = '/og/default.png'
export const DATE_FORMAT = new Intl.DateTimeFormat('en-GB', {
	day: 'numeric',
	month: 'short',
	year: 'numeric',
	timeZone: 'UTC',
})

interface SitePageLink {
	label: string
	to: LinkProps['to']
}

export const SITE_PAGE_LINKS: readonly SitePageLink[] = [
	{ label: 'Blog', to: '/site/blog' },
	{ label: 'Changelog', to: '/site/changelog' },
]
