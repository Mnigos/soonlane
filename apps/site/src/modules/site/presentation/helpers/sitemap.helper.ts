import {
	getPostLastModified,
	getPostPath,
} from '@/modules/blog/presentation/helpers/post.helper'
import { sortedPosts } from '@/modules/blog/presentation/helpers/sorted-posts.helper'
import { RELEASES } from '@/modules/changelog/infrastructure/releases.constants'
import { getLegalDocument } from './legal-document.helper'
import { toSiteUrl } from './seo.helper'
import { escapeXml } from './xml.helper'

interface SitemapEntry {
	path: string
	lastmod?: string
}

const POST_ENTRIES = sortedPosts
	.filter(({ published }) => published)
	.map(post => ({
		path: getPostPath(post.slug),
		lastmod: getPostLastModified(post),
	}))

const SITEMAP_ENTRIES: SitemapEntry[] = [
	{ path: '/' },
	{ path: '/changelog', lastmod: RELEASES[0]?.date },
	{ path: '/privacy', lastmod: getLegalDocument('privacy').updated },
	{ path: '/terms', lastmod: getLegalDocument('terms').updated },
	{
		path: '/blog',
		lastmod: POST_ENTRIES.map(({ lastmod }) => lastmod)
			.toSorted((left, right) => left.localeCompare(right))
			.at(-1),
	},
	...POST_ENTRIES,
]

function toUrlElement({ path, lastmod }: SitemapEntry) {
	const loc = `<loc>${escapeXml(toSiteUrl(path))}</loc>`

	return lastmod
		? `  <url>${loc}<lastmod>${escapeXml(lastmod)}</lastmod></url>`
		: `  <url>${loc}</url>`
}

export function buildSitemap() {
	return [
		'<?xml version="1.0" encoding="UTF-8"?>',
		'<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
		...SITEMAP_ENTRIES.map(toUrlElement),
		'</urlset>',
		'',
	].join('\n')
}
