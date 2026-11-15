import type { DesktopHostMessage } from '@soonlane/app/shell/helpers/desktop-host.helper'
import { Electroview } from 'electrobun/view'
import type { PageRpcSchema } from '../../../platform/electrobun/page-rpc.types'

export type SignInStatus = 'idle' | 'waiting' | 'failed'

/** Module state: the token lives only in this page's memory, never in its storage. */
let tokenRead: Promise<string | null> | undefined
let signInStatus: SignInStatus = 'idle'
const listeners = new Set<() => void>()
const updateReadyHandlers = new Set<() => void>()
/** Downloading an update can take minutes on a slow connection. */
const INSTALL_TIMEOUT_MS = 10 * 60 * 1000

function setSignInStatus(next: SignInStatus) {
	signInStatus = next
	for (const listener of listeners) listener()
}

const rpc = Electroview.defineRPC<PageRpcSchema>({
	// Signing out waits for the API to revoke the session.
	maxRequestTime: 15_000,
	handlers: {
		messages: {
			// A fresh page per session: no cache, no pending mutation and no view of the previous user survives.
			tokenChanged: () => location.reload(),
			signInFailed: () => setSignInStatus('failed'),
			updateReady: () => {
				for (const handler of updateReadyHandlers) handler()
			},
		},
	},
})

// oxlint-disable-next-line no-new -- the constructor connects the RPC to the main process
new Electroview({ rpc })

/** The page's view of the desktop session, which the main process owns. */
export const desktopHost = {
	subscribe: (listener: () => void) => {
		listeners.add(listener)

		return () => listeners.delete(listener)
	},
	getSignInStatus: () => signInStatus,
	/** One read per page; a failed one is retried on the next call. */
	readToken: async () => {
		tokenRead ??= rpc.request.readToken(undefined).catch((error: unknown) => {
			tokenRead = undefined
			throw error
		})

		return await tokenRead
	},
	signIn: async () => {
		setSignInStatus('waiting')

		try {
			await rpc.request.signIn(undefined)
		} catch (error) {
			setSignInStatus('failed')
			throw error
		}
	},
	signOut: async () => await rpc.request.signOut(undefined),
	onUpdateReady: (handler: () => void) => updateReadyHandlers.add(handler),
	/** Downloads a newer version and restarts into it; resolves false when there is none or it failed. */
	installUpdate: async () =>
		await rpc.request.installUpdate(undefined, {
			maxRequestTime: INSTALL_TIMEOUT_MS,
		}),
	applyUpdate: async () => await rpc.request.applyUpdate(undefined),
	sendToMain: (message: DesktopHostMessage) => {
		rpc.send.pageMessage(message)
	},
}
