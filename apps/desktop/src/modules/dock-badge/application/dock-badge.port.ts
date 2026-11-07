import { Context, type Effect } from 'effect'

export class DockBadge extends Context.Service<
	DockBadge,
	{
		readonly show: (count: number) => Effect.Effect<void>
	}
>()('soonlane/DockBadge') {}
