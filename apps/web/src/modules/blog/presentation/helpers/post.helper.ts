import type { Post } from 'content-collections'

export function getPostPath(slug: string) {
	return `/blog/${slug}`
}

export function getPostLastModified({ date, updated }: Post) {
	return updated ?? date
}
