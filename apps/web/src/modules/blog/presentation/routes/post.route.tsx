import { createFileRoute, notFound } from '@tanstack/react-router'
import { NotFound } from '@/components/not-found'
import { ProsePage } from '@/modules/site/presentation/components/prose-page'
import {
	buildPageHead,
	jsonLdScript,
	toSiteUrl,
} from '@/modules/site/presentation/helpers/seo.helper'
import { SITE_NAME } from '@/modules/site/presentation/site.constants'
import { OG_IMAGE_SIZE } from '../blog.constants'
import { PostByline } from '../components/post-byline'
import {
	getPostLastModified,
	getPostOgImagePath,
	getPostPath,
} from '../helpers/post.helper'

export const Route = createFileRoute('/_site/blog/$slug')({
	loader: async ({ params }) => {
		// A static import would put every post in the main bundle.
		const { sortedPosts } = await import('../helpers/sorted-posts.helper')
		const post = sortedPosts.find(({ slug }) => slug === params.slug)

		if (!post) throw notFound()

		return post
	},
	head: ({ loaderData: post }) => {
		if (!post) return {}

		const path = getPostPath(post.slug)
		const image = post.image ?? getPostOgImagePath(post.slug)
		const lastModified = getPostLastModified(post)
		const { meta, links } = buildPageHead({
			title: `${post.title} · ${SITE_NAME}`,
			description: post.description,
			path,
			image,
			imageAlt: post.title,
			imageSize: post.image ? undefined : OG_IMAGE_SIZE,
			type: 'article',
		})

		return {
			meta: [
				...meta,
				{ property: 'article:published_time', content: post.date },
				{ property: 'article:modified_time', content: lastModified },
				...(post.published ? [] : [{ name: 'robots', content: 'noindex' }]),
			],
			links,
			scripts: [
				jsonLdScript({
					'@context': 'https://schema.org',
					'@type': 'BlogPosting',
					headline: post.title,
					description: post.description,
					datePublished: post.date,
					dateModified: lastModified,
					author: {
						'@type': 'Person',
						name: 'Igor Makowski',
						url: 'https://github.com/Mnigos',
					},
					image: toSiteUrl(image),
					mainEntityOfPage: toSiteUrl(path),
					publisher: {
						'@type': 'Organization',
						name: SITE_NAME,
						logo: toSiteUrl('/favicon.svg'),
					},
				}),
				jsonLdScript({
					'@context': 'https://schema.org',
					'@type': 'BreadcrumbList',
					itemListElement: (
						[
							['Home', '/'],
							['Blog', '/blog'],
							[post.title, path],
						] as const
					).map(([name, itemPath], index) => ({
						'@type': 'ListItem',
						position: index + 1,
						name,
						item: toSiteUrl(itemPath),
					})),
				}),
			],
		}
	},
	component: PostRoute,
	notFoundComponent: () => <NotFound className="w-full flex-1 py-16" />,
})

function PostRoute() {
	const post = Route.useLoaderData()

	return (
		<ProsePage
			byline={<PostByline post={post} />}
			mdx={post.mdx}
			title={post.title}
		/>
	)
}
