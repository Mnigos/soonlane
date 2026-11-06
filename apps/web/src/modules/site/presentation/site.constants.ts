import type { LinkProps } from '@tanstack/react-router'

// The canonical origin is fixed, so previews and other hosts never compete with soonlane.com.
export const SITE_URL = 'https://soonlane.com'
export const SITE_NAME = 'Soonlane'
export const SITE_DESCRIPTION =
	'A quiet task list organised by days: Upcoming with Overdue, Today and every day after, and a composer that reads typed dates. Free and open source.'
export const GITHUB_URL = 'https://github.com/Mnigos/soonlane'
export const LICENSE_URL = `${GITHUB_URL}/blob/main/LICENSE`
export const CONTACT_EMAIL = 'hello@soonlane.com'
export const DEFAULT_OG_IMAGE = '/og/default.png'

interface SitePageLink {
	label: string
	to: LinkProps['to']
}

// The header nav and the footer's Product column; Blog and Changelog join once their routes exist.
export const SITE_PAGE_LINKS: readonly SitePageLink[] = []
