import { Context, type Effect } from 'effect'

export class DockBadge extends Context.Service<
	DockBadge,
	{
		/** Shows the count on the app's Dock icon; zero clears the badge. */
		readonly show: (count: number) => Effect.Effect<void>
	}
>()('soonlane/DockBadge') {}
