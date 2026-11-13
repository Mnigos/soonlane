import { Button } from '@soonlane/ui/components/button'
import { type ErrorComponentProps, useRouter } from '@tanstack/react-router'
import { isConnectionError } from '../helpers/connection.helper'
import { NoConnectionScreen } from './no-connection-screen'

/** A view that failed to load; never shows the error itself. Without a connection, the screen that reconnects on its own. */
export function RouteError({ error }: Readonly<ErrorComponentProps>) {
	const router = useRouter()

	if (isConnectionError(error)) return <NoConnectionScreen />

	return (
		<main className="mx-auto flex min-h-dvh max-w-sm flex-col justify-center gap-4 px-6">
			<div className="flex flex-col gap-1">
				<h1 className="text-xl font-semibold">Something went wrong</h1>

				<p className="text-sm text-muted-foreground">
					Could not load the page.
				</p>
			</div>

			<Button className="self-start" onClick={() => void router.invalidate()}>
				Try again
			</Button>
		</main>
	)
}
