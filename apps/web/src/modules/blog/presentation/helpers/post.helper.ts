import type { Post } from 'content-collections'
import { POST_OG_IMAGE_DIR } from '../blog.constants'

export function getPostPath(slug: string) {
	return `/blog/${slug}`
}

export function getPostOgImagePath(slug: string) {
	return `${POST_OG_IMAGE_DIR}/${slug}.png`
}

export function getPostLastModified({ date, updated }: Post) {
	return updated ?? date
}
