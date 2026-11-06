import type { Thing, WithContext } from 'schema-dts'
import { DEFAULT_OG_IMAGE, SITE_NAME, SITE_URL } from '../site.constants'

interface PageHeadInput {
	title: string
	description: string
	path: string
	image?: string
	type?: 'website' | 'article'
}

export function toSiteUrl(path: string) {
	return new URL(path, SITE_URL).href
}

export function buildPageHead({
	title,
	description,
	path,
	image = DEFAULT_OG_IMAGE,
	type = 'website',
}: PageHeadInput) {
	const url = toSiteUrl(path)
	const imageUrl = toSiteUrl(image)

	return {
		meta: [
			{ title },
			{ name: 'description', content: description },
			{ property: 'og:title', content: title },
			{ property: 'og:description', content: description },
			{ property: 'og:type', content: type },
			{ property: 'og:url', content: url },
			{ property: 'og:image', content: imageUrl },
			{ property: 'og:site_name', content: SITE_NAME },
			{ name: 'twitter:card', content: 'summary_large_image' },
			{ name: 'twitter:title', content: title },
			{ name: 'twitter:description', content: description },
			{ name: 'twitter:image', content: imageUrl },
		],
		links: [{ rel: 'canonical', href: url }],
	}
}

// Escaping '<' keeps a value containing '</script>' from closing the tag.
export function jsonLdScript(data: WithContext<Thing>) {
	return {
		type: 'application/ld+json',
		children: JSON.stringify(data).replaceAll('<', String.raw`\u003c`),
	}
}
