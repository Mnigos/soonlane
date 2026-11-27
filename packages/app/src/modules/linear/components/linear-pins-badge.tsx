import type { LinearPin } from '@soonlane/contracts'
import { LINEAR_COPY } from '../helpers/linear-copy.constants'
import { LinearIcon } from './linear-icon'

interface LinearPinsBadgeProps {
	pins: LinearPin[]
}

/** The task row's badge: the first pinned issue's identifier and "+N" for the rest, from the stored pins only. */
export function LinearPinsBadge({ pins }: Readonly<LinearPinsBadgeProps>) {
	const [first, ...others] = pins

	if (!first) return null

	return (
		<span className="flex items-center gap-0.5 text-muted-foreground">
			<LinearIcon className="size-3" />
			<span aria-hidden>
				{first.identifier}

				{others.length > 0 && (
					<span className="text-faint-foreground"> +{others.length}</span>
				)}
			</span>
			<span className="sr-only">
				{LINEAR_COPY.badgeLabel.replace(
					'{ids}',
					pins.map(({ identifier }) => identifier).join(', ')
				)}
			</span>
		</span>
	)
}
