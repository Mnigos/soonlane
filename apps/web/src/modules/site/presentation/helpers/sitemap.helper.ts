import { SITE_URL } from '../site.constants'

interface SitemapEntry {
	path: string
	lastmod?: string
}

// Every prerendered public page; robots.txt points crawlers here.
const SITEMAP_ENTRIES: SitemapEntry[] = [{ path: '/' }]

function escapeXml(value: string) {
	return value
		.replaceAll('&', '&amp;')
		.replaceAll('<', '&lt;')
		.replaceAll('>', '&gt;')
		.replaceAll("'", '&apos;')
		.replaceAll('"', '&quot;')
}

function toUrlElement({ path, lastmod }: SitemapEntry) {
	const loc = `<loc>${escapeXml(new URL(path, SITE_URL).href)}</loc>`

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
