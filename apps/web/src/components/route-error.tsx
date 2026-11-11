import { cn } from '@soonlane/ui/cn'
import { Button } from '@soonlane/ui/components/button'
import { type ErrorComponentProps, useRouter } from '@tanstack/react-router'
import {
	isChunkLoadError,
	reloadAfterChunkError,
} from '@/utils/stale-chunk.util'

const FAILED_COPY = {
	title: 'Something went wrong',
	description: 'Could not load the page.',
	action: 'Try again',
}
const UPDATED_COPY = {
	title: 'Soonlane was updated',
	description: 'Reload the page to get the new version.',
	action: 'Reload',
}

interface RouteErrorProps {
	error: unknown
	className?: string
}

/** The message for a page that failed to load; never shows the error itself, which can name module URLs. */
export function RouteError({ error, className }: Readonly<RouteErrorProps>) {
	const router = useRouter()
	const isUpdated = isChunkLoadError(error)
	const copy = isUpdated ? UPDATED_COPY : FAILED_COPY

	return (
		<main
			className={cn(
				'mx-auto flex max-w-sm flex-col justify-center gap-4 px-6',
				className
			)}
		>
			<div className="flex flex-col gap-1">
				<h1 className="text-xl font-semibold">{copy.title}</h1>

				<p className="text-sm text-muted-foreground">{copy.description}</p>
			</div>

			<Button
				className="self-start"
				onClick={() =>
					void (isUpdated ? reloadAfterChunkError(error) : router.invalidate())
				}
			>
				{copy.action}
			</Button>
		</main>
	)
}

/** Full-height screen for a layout that failed, where no navigation can render around the message. */
export function LayoutError({ error }: Readonly<ErrorComponentProps>) {
	return <RouteError className="min-h-dvh" error={error} />
}
