import { defineCollection, defineConfig } from '@content-collections/core'
import { z } from 'zod'
import { isPostPublished } from './src/modules/blog/domain/post-visibility.helper'

const BUILD_DAY = new Date().toISOString().slice(0, 10)
const IS_PRODUCTION = process.env.APP_ENV === 'production'

const legal = defineCollection({
	name: 'legal',
	directory: 'src/modules/landing/content',
	include: '*.mdx',
	schema: z.object({
		title: z.string(),
		description: z.string(),
		updated: z.iso.date(),
		content: z.string(),
	}),
	// The body is a module of its own (`vite.config.ts`), so the data drops it.
	transform: ({ content: _content, ...frontmatter }) => frontmatter,
})

const posts = defineCollection({
	name: 'posts',
	directory: 'src/modules/blog/content',
	include: '*.mdx',
	schema: z.object({
		title: z.string(),
		description: z.string().max(160),
		date: z.iso.date(),
		updated: z.iso.date().optional(),
		draft: z.boolean().default(false),
		image: z.string().startsWith('/blog/').optional(),
		content: z.string(),
	}),
	transform: (document, context) => {
		const { content: _content, draft: _draft, ...frontmatter } = document
		const published = isPostPublished(document, BUILD_DAY)

		// Skipped here, draft text never reaches a production page or script; only listed posts get a body module.
		if (IS_PRODUCTION && !published) return context.skip('unpublished')

		return { ...frontmatter, slug: document._meta.path, published }
	},
})

export default defineConfig({ content: [legal, posts] })
