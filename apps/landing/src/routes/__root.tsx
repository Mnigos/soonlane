import { ConsentProvider } from '@soonlane/analytics/components/consent-provider'
import {
	createRootRoute,
	HeadContent,
	Outlet,
	retainSearchParams,
	Scripts,
} from '@tanstack/react-router'
import { IS_ANALYTICS_ENABLED } from '@/modules/analytics/presentation/browser-analytics.constants'
import {
	CAMPAIGN_PARAMS,
	campaignSearchSchema,
} from '@/modules/analytics/presentation/campaign-search.schema'
import {
	BLOG_TITLE,
	RSS_PATH,
} from '@/modules/blog/presentation/blog.constants'
import { LandingFooter } from '@/modules/landing/presentation/components/landing-footer'
import { LandingHeader } from '@/modules/landing/presentation/components/landing-header'
import { NotFoundPage } from '@/modules/landing/presentation/components/not-found-page'
import { SIGNED_IN_HINT_SCRIPT } from '@/modules/landing/presentation/helpers/signed-in-hint.helper'
import { AUTH_COOKIE_PREFIX } from '@/modules/landing/presentation/landing-environment.constants'
import appCss from '../styles.css?url'

export const Route = createRootRoute({
	validateSearch: campaignSearchSchema,
	search: { middlewares: [retainSearchParams([...CAMPAIGN_PARAMS])] },
	head: () => ({
		meta: [
			{ charSet: 'utf-8' },
			{ name: 'viewport', content: 'width=device-width, initial-scale=1' },
			{ title: 'Soonlane' },
			{ name: 'theme-color', content: '#1e1e1e' },
		],
		links: [
			{ rel: 'stylesheet', href: appCss },
			{ rel: 'icon', href: '/favicon.svg', type: 'image/svg+xml' },
			{
				rel: 'alternate',
				type: 'application/rss+xml',
				title: BLOG_TITLE,
				href: RSS_PATH,
			},
		],
		scripts: [{ children: SIGNED_IN_HINT_SCRIPT }],
	}),
	component: RootComponent,
	notFoundComponent: NotFoundPage,
})

/** Every page's document and layout; an unknown path renders the not-found page in the outlet. */
function RootComponent() {
	return (
		// The signed-in hint script sets a data attribute on <html> before hydration.
		<html lang="en" suppressHydrationWarning>
			<head>
				<HeadContent />
			</head>

			<body className="min-h-dvh bg-background font-sans text-foreground antialiased">
				<ConsentProvider
					cookiePrefix={AUTH_COOKIE_PREFIX}
					isAnalyticsEnabled={IS_ANALYTICS_ENABLED}
					privacyPolicyUrl="/privacy"
				>
					<div className="flex min-h-dvh flex-col [&_a]:focus-visible:outline-2 [&_a]:focus-visible:outline-offset-2 [&_a]:focus-visible:outline-primary">
						<LandingHeader />

						<Outlet />

						<LandingFooter />
					</div>
				</ConsentProvider>

				<Scripts />
			</body>
		</html>
	)
}
