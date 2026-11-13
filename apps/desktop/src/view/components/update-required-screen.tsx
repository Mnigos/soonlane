import { buttonVariants } from '@soonlane/ui/components/button'
import { UPDATE_COPY } from '../helpers/update-copy.constants'

/** The latest release's page; opens in the system browser like every web link. */
const LATEST_RELEASE_URL = 'https://github.com/Mnigos/soonlane/releases/latest'

/** Shown instead of every view when the API no longer serves this version of the app. */
export function UpdateRequiredScreen() {
	return (
		<main className="mx-auto flex min-h-dvh max-w-sm flex-col justify-center gap-4 px-6">
			<div aria-hidden className="fixed inset-x-0 top-0 h-8 app-drag" />

			<div className="flex flex-col gap-1">
				<h1 className="text-xl font-semibold">{UPDATE_COPY.title}</h1>

				<p className="text-sm text-muted-foreground">{UPDATE_COPY.body}</p>
			</div>

			<a
				className={buttonVariants({ className: 'self-start' })}
				href={LATEST_RELEASE_URL}
				rel="noreferrer"
				target="_blank"
			>
				{UPDATE_COPY.download}
			</a>
		</main>
	)
}
