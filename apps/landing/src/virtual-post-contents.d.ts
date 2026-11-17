declare module 'virtual:post-contents' {
	import type { MDXContent } from 'mdx/types'

	/** The compiled body of each post content-collections lists, by slug. */
	export const postContents: ReadonlyMap<string, MDXContent>
}
