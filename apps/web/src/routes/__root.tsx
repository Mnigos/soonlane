import { ConsentProvider } from '@soonlane/analytics/components/consent-provider'
import {
	createRootRouteWithContext,
	type ErrorComponentProps,
	HeadContent,
	Outlet,
	Scripts,
} from '@tanstack/react-router'
import type { PropsWithChildren } from 'react'
import { LayoutError } from '@/components/route-error'
import { IS_ANALYTICS_ENABLED } from '@/modules/analytics/domain/analytics.constants'
import { AUTH_COOKIE_PREFIX } from '@/modules/identity/presentation/auth-cookie.constants'
import { SIGNED_IN_HINT_SCRIPT } from '@/modules/site/presentation/helpers/signed-in-hint.helper'
import type { RouterContext } from '../router'
import appCss from '../styles.css?url'

export const Route = createRootRouteWithContext<RouterContext>()({
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
		],
		scripts: [{ children: SIGNED_IN_HINT_SCRIPT }],
	}),
	component: RootComponent,
	errorComponent: RootError,
})

function RootComponent() {
	return (
		<RootDocument>
			<ConsentProvider
				cookiePrefix={AUTH_COOKIE_PREFIX}
				isAnalyticsEnabled={IS_ANALYTICS_ENABLED}
				privacyPolicyPath="/site/privacy"
			>
				<Outlet />
			</ConsentProvider>
		</RootDocument>
	)
}

function RootError(props: Readonly<ErrorComponentProps>) {
	return (
		<RootDocument>
			<LayoutError {...props} />
		</RootDocument>
	)
}

function RootDocument({ children }: Readonly<PropsWithChildren>) {
	return (
		// The desktop shell and the signed-in hint script set data attributes on <html> before hydration.
		<html lang="en" suppressHydrationWarning>
			<head>
				<HeadContent />
			</head>

			<body className="min-h-dvh bg-background font-sans text-foreground antialiased">
				{children}

				<Scripts />
			</body>
		</html>
	)
}
