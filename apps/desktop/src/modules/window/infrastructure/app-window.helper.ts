import { DESKTOP_PAGE_ORIGIN } from '@soonlane/auth'
import { Effect, Option, Stream } from 'effect'
import { BrowserView, BrowserWindow, type WindowOptionsType } from 'electrobun'
import type { PageRpcSchema } from '../../../platform/electrobun/page-rpc.types'
import { PAGE_NAVIGATION_RULES } from '../../navigation/domain/navigation.helper'
import { DesktopSession } from '../../sign-in/application/desktop-session.service'

/**
 * A window on the bundled page at an app path (`APP_PATHS`, served from the
 * hash), with the navigation rules that keep it there and the typed RPC that
 * lends the page the desktop token. Session changes reach the page until the
 * enclosing scope closes.
 */
export const openAppWindow = Effect.fn('AppWindow.open')(function* (
	path: string,
	options: Pick<WindowOptionsType, 'title' | 'frame' | 'titleBarStyle'> &
		Partial<Pick<WindowOptionsType, 'styleMask'>>
) {
	const session = yield* DesktopSession
	const context = yield* Effect.context()
	const rpc = BrowserView.defineRPC<PageRpcSchema>({
		handlers: {
			requests: {
				readToken: async () =>
					Option.getOrNull(await Effect.runPromiseWith(context)(session.token)),
				signIn: async () =>
					await Effect.runPromiseWith(context)(
						session.signIn.pipe(Effect.as(undefined))
					),
				signOut: async () =>
					await Effect.runPromiseWith(context)(
						session.signOut.pipe(Effect.as(undefined))
					),
			},
		},
	})
	const window = new BrowserWindow({
		...options,
		url: `${DESKTOP_PAGE_ORIGIN}/index.html#${path}`,
		renderer: 'native',
		rpc,
	})

	// Electrobun 2.0.6 ignores the navigationRules window option for the main view, so the rules are set on the view.
	window.webview.setNavigationRules(PAGE_NAVIGATION_RULES)

	yield* session.events.pipe(
		Stream.runForEach(event =>
			Effect.sync(() =>
				event.type === 'token-changed'
					? rpc.send.tokenChanged({ token: Option.getOrNull(event.token) })
					: rpc.send.signInFailed(undefined)
			)
		),
		Effect.forkScoped
	)

	return window
})
