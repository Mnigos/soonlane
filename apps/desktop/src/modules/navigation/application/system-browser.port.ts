import { Context, type Effect } from 'effect'

export class SystemBrowser extends Context.Service<
	SystemBrowser,
	{
		/** Whether the system accepted the URL. */
		readonly open: (url: URL) => Effect.Effect<boolean>
	}
>()('soonlane/SystemBrowser') {}
