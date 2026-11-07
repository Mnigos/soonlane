import { Context, type Effect } from 'effect'

export class SystemBrowser extends Context.Service<
	SystemBrowser,
	{
		readonly open: (url: URL) => Effect.Effect<boolean>
	}
>()('soonlane/SystemBrowser') {}
