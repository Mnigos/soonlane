import { Button } from '@soonlane/ui/components/button'
import { useMutation, useQuery } from '@tanstack/react-query'
import { useRouter } from '@tanstack/react-router'
import { pingApi } from '../helpers/connection.helper'
import { NO_CONNECTION_COPY } from '../helpers/no-connection-copy.constants'

const RECONNECT_INTERVAL_MS = 5000

/** Shown while the API cannot be reached; once a ping answers, the routes load again on their own. */
export function NoConnectionScreen() {
	const router = useRouter()
	const reconnect = async () => {
		await pingApi()
		await router.invalidate()

		return true
	}

	useQuery({
		queryKey: ['desktop', 'reconnect'],
		queryFn: reconnect,
		refetchInterval: RECONNECT_INTERVAL_MS,
		gcTime: 0,
	})

	const { mutate: retry, isPending } = useMutation({ mutationFn: reconnect })

	return (
		<main className="mx-auto flex min-h-dvh max-w-sm flex-col justify-center gap-4 px-6">
			<div aria-hidden className="fixed inset-x-0 top-0 h-8 app-drag" />

			<div className="flex flex-col gap-1">
				<h1 className="text-xl font-semibold">{NO_CONNECTION_COPY.title}</h1>

				<p className="text-sm text-muted-foreground">
					{NO_CONNECTION_COPY.body}
				</p>
			</div>

			<Button
				className="self-start"
				disabled={isPending}
				onClick={() => retry()}
			>
				{isPending ? NO_CONNECTION_COPY.retrying : NO_CONNECTION_COPY.retry}
			</Button>
		</main>
	)
}
