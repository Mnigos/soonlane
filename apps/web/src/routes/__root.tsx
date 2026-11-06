import { Button } from '@soonlist/ui/components/button'
import {
	createRootRouteWithContext,
	type ErrorComponentProps,
	HeadContent,
	Outlet,
	Scripts,
	useRouter,
} from '@tanstack/react-router'
import type { PropsWithChildren } from 'react'
import type { RouterContext } from '../router'
import appCss from '../styles.css?url'

export const Route = createRootRouteWithContext<RouterContext>()({
	beforeLoad: async ({ context }) => ({
		me: await context.queryClient.query(
			context.orpc.identity.me.queryOptions()
		),
	}),
	head: () => ({
		meta: [
			{ charSet: 'utf-8' },
			{ name: 'viewport', content: 'width=device-width, initial-scale=1' },
			{ title: 'Soonlist' },
			{ name: 'theme-color', content: '#1e1e1e' },
			{ name: 'robots', content: 'noindex, nofollow' },
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
			<Outlet />
		</RootDocument>
	)
}

function RootError({ error }: Readonly<ErrorComponentProps>) {
	const router = useRouter()

	return (
		<RootDocument>
			<main className="mx-auto flex min-h-dvh max-w-sm flex-col justify-center gap-4 px-6">
				<div className="flex flex-col gap-1">
					<h1 className="text-xl font-semibold">Something went wrong</h1>

					<p className="text-sm text-muted-foreground">
						{(error instanceof Error && error.message) ||
							'Could not load the page.'}
					</p>
				</div>

				<Button className="self-start" onClick={() => void router.invalidate()}>
					Try again
				</Button>
			</main>
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
