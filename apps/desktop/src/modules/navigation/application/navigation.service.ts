import { Context, Effect, Layer } from 'effect'
import { resolveExternalLink } from '../domain/navigation.helper'
import { SystemBrowser } from './system-browser.port'

export class NavigationService extends Context.Service<
	NavigationService,
	{
		/** A link that leaves the bundled page, from a new-window request or a blocked navigation. */
		readonly openExternal: (href: string) => Effect.Effect<void>
	}
>()('soonlane/NavigationService') {}

export const NavigationServiceLive = Layer.effect(
	NavigationService,
	Effect.gen(function* () {
		const systemBrowser = yield* SystemBrowser

		return NavigationService.of({
			openExternal: Effect.fn('NavigationService.openExternal')(
				function* (href) {
					const url = resolveExternalLink(href)

					// Logs leave the URL out: links can carry tokens.
					if (url && !(yield* systemBrowser.open(url)))
						yield* Effect.logWarning('The system browser did not open a link')
				}
			),
		})
	})
)
