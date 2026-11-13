import type { Post } from 'content-collections'
import { toSiteUrl } from '@/modules/site/presentation/helpers/seo.helper'
import { escapeXml } from '@/modules/site/presentation/helpers/xml.helper'
import { BLOG_DESCRIPTION, BLOG_TITLE, RSS_PATH } from '../blog.constants'
import { getPostPath } from './post.helper'
import { sortedPosts } from './sorted-posts.helper'

function toItemElement({ slug, title, date, description }: Post) {
	const link = escapeXml(toSiteUrl(getPostPath(slug)))

	return [
		'    <item>',
		`      <title>${escapeXml(title)}</title>`,
		`      <link>${link}</link>`,
		`      <guid isPermaLink="true">${link}</guid>`,
		`      <pubDate>${new Date(date).toUTCString()}</pubDate>`,
		`      <description>${escapeXml(description)}</description>`,
		'    </item>',
	].join('\n')
}

export function buildRss() {
	return [
		'<?xml version="1.0" encoding="UTF-8"?>',
		'<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">',
		'  <channel>',
		`    <title>${escapeXml(BLOG_TITLE)}</title>`,
		`    <link>${escapeXml(toSiteUrl('/blog'))}</link>`,
		`    <description>${escapeXml(BLOG_DESCRIPTION)}</description>`,
		'    <language>en</language>',
		`    <atom:link href="${escapeXml(toSiteUrl(RSS_PATH))}" rel="self" type="application/rss+xml" />`,
		...sortedPosts.map(toItemElement),
		'  </channel>',
		'</rss>',
		'',
	].join('\n')
}
