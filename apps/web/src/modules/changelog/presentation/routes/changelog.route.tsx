import { createFileRoute } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import { buildPageHead } from '@/modules/site/presentation/helpers/seo.helper'
import {
	RELEASES_URL,
	SITE_NAME,
} from '@/modules/site/presentation/site.constants'
import { formatDayMonthYear } from '@/modules/tasks/domain/calendar-date.helper'
import { RELEASES } from '../../infrastructure/releases.constants'
import { ChangelogPage } from '../components/changelog-page'

/** The client build gets an RPC stub, so the changelog text stays out of the browser bundle. */
const getReleases = createServerFn({ method: 'GET' }).handler(() => RELEASES)
const DESCRIPTION = 'What changed in every stable release of Soonlane.'

export const Route = createFileRoute('/_site/changelog')({
	loader: async () => await getReleases(),
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
