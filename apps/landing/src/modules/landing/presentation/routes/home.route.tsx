import { createFileRoute } from '@tanstack/react-router'
import { ClosingBand } from '../components/closing-band'
import { FeatureRow } from '../components/feature-row'
import { HomeContents } from '../components/home-contents'
import { HomeFaq } from '../components/home-faq'
import { HomeHero } from '../components/home-hero'
import { OpenSourceSection } from '../components/open-source-section'
import {
	buildFaqPageJsonLd,
	buildPageHead,
	jsonLdScript,
} from '../helpers/seo.helper'
import {
	HOME_DESCRIPTION,
	HOME_FAQ,
	HOME_FEATURES,
	HOME_HERO,
	HOME_TITLE,
} from '../home.constants'
import { SITE_NAME, LANDING_URL } from '../landing.constants'

export const Route = createFileRoute('/')({
	head: () => ({
		...buildPageHead({
			title: HOME_TITLE,
			description: HOME_DESCRIPTION,
			path: '/',
		}),
		scripts: [
			jsonLdScript({
				'@context': 'https://schema.org',
				'@type': 'WebSite',
				name: SITE_NAME,
				url: LANDING_URL,
			}),
			jsonLdScript({
				'@context': 'https://schema.org',
				'@type': 'SoftwareApplication',
				name: SITE_NAME,
				description: HOME_DESCRIPTION,
				url: LANDING_URL,
				applicationCategory: 'BusinessApplication',
				operatingSystem: 'Web, macOS',
				offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
				license: 'https://www.gnu.org/licenses/agpl-3.0.html',
				author: {
					'@type': 'Person',
					name: 'Igor Makowski',
					url: 'https://github.com/Mnigos',
				},
				screenshot: new URL(HOME_HERO.desktopImage.src, LANDING_URL).href,
				featureList: [
					'Inbox for undated tasks without a project',
					'Upcoming default view with every day in one scrolling list',
					'Today view with Inbox and overdue tasks on top',
					'Repeating tasks and P1 to P4 priorities',
					'Projects and sidebar label views',
					'Subtasks up to four levels deep',
					'Goals with progress tracking',
					'Read-only Todoist import with preview',
					'Free Mac app',
					'Calendar subscription for Apple Calendar and Google Calendar',
				],
			}),
			jsonLdScript(buildFaqPageJsonLd('/', HOME_FAQ.items)),
		],
	}),
	component: HomeRoute,
})

function HomeRoute() {
	return (
		<main className="flex-1 divide-y">
			<HomeHero />

			{HOME_FEATURES.map((feature, index) => (
				<FeatureRow
					feature={feature}
					isReversed={index % 2 === 1}
					key={feature.title}
				/>
			))}

			<HomeContents />

			<OpenSourceSection />

			<HomeFaq />

			<ClosingBand />
		</main>
	)
}
