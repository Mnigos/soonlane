import { createFileRoute, notFound } from '@tanstack/react-router'
import { postContents } from 'virtual:post-contents'
import { NotFoundPage } from '@/modules/landing/presentation/components/not-found-page'
import { ProsePage } from '@/modules/landing/presentation/components/prose-page'
import {
	buildPageHead,
	jsonLdScript,
	toLandingUrl,
} from '@/modules/landing/presentation/helpers/seo.helper'
import { SITE_NAME } from '@/modules/landing/presentation/landing.constants'
import { OG_IMAGE_SIZE } from '../blog.constants'
import { PostByline } from '../components/post-byline'
import {
	getPostLastModified,
	getPostOgImagePath,
	getPostPath,
} from '../helpers/post.helper'

export const Route = createFileRoute('/blog/$slug')({
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
					image: toLandingUrl(image),
					mainEntityOfPage: toLandingUrl(path),
					publisher: {
						'@type': 'Organization',
						name: SITE_NAME,
						logo: toLandingUrl('/favicon.svg'),
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
						item: toLandingUrl(itemPath),
					})),
				}),
			],
		}
	},
	component: PostRoute,
	notFoundComponent: NotFoundPage,
})

function PostRoute() {
	const post = Route.useLoaderData()
	const content = postContents.get(post.slug)

	if (!content) throw notFound()

	return (
		<ProsePage
			byline={<PostByline post={post} />}
			content={content}
			title={post.title}
		/>
	)
}
