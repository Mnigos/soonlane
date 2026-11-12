import { createFileRoute } from '@tanstack/react-router'
import { ClosingBand } from '../components/closing-band'
import { FeatureRow } from '../components/feature-row'
import { LandingFaq } from '../components/landing-faq'
import { LandingHero } from '../components/landing-hero'
import { OpenSourceSection } from '../components/open-source-section'
import {
	buildFaqPageJsonLd,
	buildPageHead,
	jsonLdScript,
} from '../helpers/seo.helper'
import {
	LANDING_DESCRIPTION,
	LANDING_FAQ,
	LANDING_FEATURES,
	LANDING_HERO,
	LANDING_TITLE,
} from '../landing.constants'
import { SITE_NAME, SITE_URL } from '../site.constants'

export const Route = createFileRoute('/_site/')({
	head: () => ({
		...buildPageHead({
			title: LANDING_TITLE,
			description: LANDING_DESCRIPTION,
			path: '/',
		}),
		scripts: [
			jsonLdScript({
				'@context': 'https://schema.org',
				'@type': 'WebSite',
				name: SITE_NAME,
				url: SITE_URL,
			}),
			jsonLdScript({
				'@context': 'https://schema.org',
				'@type': 'SoftwareApplication',
				name: SITE_NAME,
				description: LANDING_DESCRIPTION,
				url: SITE_URL,
				applicationCategory: 'BusinessApplication',
				operatingSystem: 'Web, macOS',
				offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
				license: 'https://www.gnu.org/licenses/agpl-3.0.html',
				author: {
					'@type': 'Person',
					name: 'Igor Makowski',
					url: 'https://github.com/Mnigos',
				},
				screenshot: new URL(LANDING_HERO.desktopImage.src, SITE_URL).href,
				featureList: [
					'Upcoming view with every day in one list',
					'Today view with overdue tasks on top',
					'Repeating tasks',
					'Labels',
					'Goals with progress',
					'Calendar subscription for Apple Calendar and Google Calendar',
				],
			}),
			jsonLdScript(buildFaqPageJsonLd('/', LANDING_FAQ.items)),
		],
	}),
	component: HomeRoute,
})

function HomeRoute() {
	return (
		<main className="flex-1 divide-y">
			<LandingHero />

			{LANDING_FEATURES.map((feature, index) => (
				<FeatureRow
					feature={feature}
					isReversed={index % 2 === 1}
					key={feature.title}
				/>
			))}

			<OpenSourceSection />

			<LandingFaq />

			<ClosingBand />
		</main>
	)
}
