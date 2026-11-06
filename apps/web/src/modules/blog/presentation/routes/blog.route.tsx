import { createFileRoute, Link } from '@tanstack/react-router'
import { buildPageHead } from '@/modules/site/presentation/helpers/seo.helper'
import { SITE_NAME } from '@/modules/site/presentation/site.constants'
import { BLOG_DESCRIPTION } from '../blog.constants'
import { PostByline } from '../components/post-byline'
import { sortedPosts } from '../helpers/sorted-posts.helper'

export const Route = createFileRoute('/_site/blog')({
	head: () =>
		buildPageHead({
			title: `Blog · ${SITE_NAME}`,
			description: BLOG_DESCRIPTION,
			path: '/blog',
		}),
	component: BlogRoute,
})

function BlogRoute() {
	return (
		<main className="mx-auto flex w-full max-w-[680px] flex-1 flex-col gap-6 px-4 py-12 sm:px-6 sm:py-16">
			<h1 className="text-2xl font-bold tracking-tight">Blog</h1>

			{sortedPosts.length === 0 ? (
				<p className="text-muted-foreground">No posts yet.</p>
			) : (
				<ul className="flex flex-col divide-y">
					{sortedPosts.map(post => (
						<li
							className="flex flex-col gap-1.5 py-5 first:pt-0"
							key={post.slug}
						>
							<p className="flex flex-wrap items-center gap-x-2 text-sm text-muted-foreground">
								<PostByline post={post} />
							</p>

							<h2 className="text-lg font-semibold">
								<Link
									className="rounded-sm underline-offset-4 hover:underline"
									params={{ slug: post.slug }}
									to="/blog/$slug"
								>
									{post.title}
								</Link>
							</h2>

							<p className="leading-relaxed text-secondary-foreground">
								{post.description}
							</p>
						</li>
					))}
				</ul>
			)}
		</main>
	)
}
