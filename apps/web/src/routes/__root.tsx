import {
	createRootRouteWithContext,
	type ErrorComponentProps,
	HeadContent,
	Outlet,
	Scripts,
} from '@tanstack/react-router'
import type { PropsWithChildren } from 'react'
import { LayoutError } from '@/components/route-error'
import { ConsentProvider } from '@/modules/consent/presentation/components/consent-provider'
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
	}),
	component: RootComponent,
	errorComponent: RootError,
})

function RootComponent() {
	return (
		<RootDocument>
			<ConsentProvider>
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
		// The desktop shell sets data-shell on <html> before hydration.
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
