import { defineCollection, defineConfig } from '@content-collections/core'
import { compileMDX } from '@content-collections/mdx'
import remarkGfm from 'remark-gfm'
import { z } from 'zod'

const legal = defineCollection({
	name: 'legal',
	directory: 'src/modules/site/content',
	include: '*.mdx',
	schema: z.object({
		title: z.string(),
		description: z.string(),
		updated: z.iso.date(),
		content: z.string(),
	}),
	// Only the compiled MDX ships; the raw text would double the page's bundle.
	transform: async (document, context) => {
		const { content: _content, ...frontmatter } = document

		return {
			...frontmatter,
			mdx: await compileMDX(context, document, { remarkPlugins: [remarkGfm] }),
		}
	},
})

export default defineConfig({ content: [legal] })
