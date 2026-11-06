import { createFileRoute } from '@tanstack/react-router'
import { GetStartedButton } from '../components/get-started-button'
import { buildPageHead, jsonLdScript } from '../helpers/seo.helper'
import {
	GITHUB_URL,
	SITE_DESCRIPTION,
	SITE_NAME,
	SITE_URL,
} from '../site.constants'

export const Route = createFileRoute('/_site/')({
	head: () => ({
		...buildPageHead({
			title: `${SITE_NAME}: your tasks, from today onwards`,
			description: SITE_DESCRIPTION,
			path: '/',
		}),
		scripts: [
			jsonLdScript({
				'@context': 'https://schema.org',
				'@type': 'WebSite',
				name: SITE_NAME,
				url: SITE_URL,
			}),
		],
	}),
	component: HomeRoute,
})

function HomeRoute() {
	return (
		<main className="mx-auto flex w-full max-w-[1120px] flex-1 flex-col justify-center gap-8 px-4 py-16 sm:px-6">
			<div className="flex max-w-[680px] flex-col gap-3">
				<h1 className="text-2xl font-bold tracking-tight">{SITE_NAME}</h1>

				<p className="text-secondary-foreground">
					A quiet task list organised by days. Upcoming shows what is overdue,
					what is due today and every day after it, and a Todoist-style composer
					reads the date as you type the task.
				</p>

				<p className="text-secondary-foreground">
					Soonlane is free and open source under AGPL-3.0. Sign in with your
					Google account to get your own list.
				</p>
			</div>

			<div className="flex flex-col items-start gap-6">
				<GetStartedButton />

				<a
					className="rounded-sm text-sm underline underline-offset-4"
					href={GITHUB_URL}
				>
					View on GitHub
				</a>
			</div>
		</main>
	)
}
