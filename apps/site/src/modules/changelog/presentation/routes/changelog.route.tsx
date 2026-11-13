import { formatDayMonthYear, RELEASES_URL } from '@soonlane/domain'
import { createFileRoute } from '@tanstack/react-router'
import { buildPageHead } from '@/modules/site/presentation/helpers/seo.helper'
import { SITE_NAME } from '@/modules/site/presentation/site.constants'
import { ChangelogPage } from '../components/changelog-page'

const DESCRIPTION = 'What changed in every stable release of Soonlane.'

export const Route = createFileRoute('/changelog')({
	loader: async () => {
		// A static import would put the whole changelog in the main bundle.
		const { RELEASES } = await import('../../infrastructure/releases.constants')

		return RELEASES
	},
	head: ({ loaderData }) => {
		const latest = loaderData?.[0]
		const { meta, links } = buildPageHead({
			title: `Changelog · ${SITE_NAME}`,
			description: latest
				? `${DESCRIPTION} The latest is ${latest.version}, released ${formatDayMonthYear(latest.date)}.`
				: DESCRIPTION,
			path: '/changelog',
		})

		return {
			meta,
			links: [
				...links,
				{
					rel: 'alternate',
					type: 'application/atom+xml',
					title: `${SITE_NAME} releases`,
					href: `${RELEASES_URL}.atom`,
				},
			],
		}
	},
	component: ChangelogRoute,
})

function ChangelogRoute() {
	const releases = Route.useLoaderData()

	return <ChangelogPage releases={releases} />
}
