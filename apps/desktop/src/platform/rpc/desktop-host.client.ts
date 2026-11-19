import type { DesktopHostMessage } from '@soonlane/app/shell/helpers/desktop-host.helper'
import { Electroview } from 'electrobun/view'
import type { PageRpcSchema } from './page-rpc.types'

export type SignInStatus = 'idle' | 'waiting' | 'failed'
/** The account a deletion was started for; only this user is ever deleted. */
export type DeletingAccount =
	PageRpcSchema['bun']['requests']['signInToDelete']['params']
/** How a deletion ended without failing; see the main process's `AccountDeletion`. */
export type AccountDeletion =
	PageRpcSchema['bun']['requests']['deleteAccount']['response']

/** Module state: the token lives only in this page's memory, never in its storage. */
let tokenRead: Promise<string | null> | undefined
let deletionReturnRead: Promise<DeletingAccount | null> | undefined
let signInStatus: SignInStatus = 'idle'
const listeners = new Set<() => void>()
const updateReadyHandlers = new Set<() => void>()
/**
 * Installing or restarting waits for a download in flight, however long it
 * takes: a timeout would show a failure while the main process still restarts
 * afterwards, since Electrobun's timeout does not cancel the handler.
 */
const UPDATE_TIMEOUT_MS = Number.POSITIVE_INFINITY
/** How often a page asks whether an update waits before it gives up, and how long it waits in between. */
const READY_READ_ATTEMPTS = 5
const READY_READ_DELAY_MS = 3000

function setSignInStatus(next: SignInStatus) {
	signInStatus = next
	for (const listener of listeners) listener()
}

async function startSignIn(request: () => Promise<undefined>) {
	setSignInStatus('waiting')

	try {
		await request()
	} catch (error) {
		setSignInStatus('failed')
		throw error
	}
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

/** Runs the handler when an update waits; asks again after a failed read, since nothing else tells a reloaded page of an update that was already waiting. */
function readUpdateReady(handler: () => void, attempt = 1) {
	rpc.request
		.isUpdateReady(undefined)
		.then(isReady => {
			if (isReady) handler()
		})
		.catch(() => {
			if (attempt < READY_READ_ATTEMPTS)
				setTimeout(
					() => readUpdateReady(handler, attempt + 1),
					READY_READ_DELAY_MS
				)
		})
}

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
	signIn: async () =>
		await startSignIn(async () => await rpc.request.signIn(undefined)),
	signOut: async () => await rpc.request.signOut(undefined),
	/** After a deletion the main process forgets the token and every page reloads signed out. */
	deleteAccount: async (userId: string) =>
		await rpc.request.deleteAccount({ userId }),
	signInToDelete: async ({ id, email }: DeletingAccount) =>
		await startSignIn(
			async () => await rpc.request.signInToDelete({ id, email })
		),
	/** One take per page, which reloads after every sign-in; a failed one is retried on the next call. */
	takeDeletionReturn: async () => {
		deletionReturnRead ??= rpc.request
			.takeDeletionReturn(undefined)
			.catch((error: unknown) => {
				deletionReturnRead = undefined
				throw error
			})

		return await deletionReturnRead
	},
	/** Once the page has handled the return, a later read finds none, so nothing reopens the dialog. */
	settleDeletionReturn: () => {
		deletionReturnRead = Promise.resolve(null)
	},
	/** Runs the handler now when an update already waits, and again each time one does. */
	onUpdateReady: (handler: () => void) => {
		updateReadyHandlers.add(handler)
		readUpdateReady(handler)
	},
	/** Downloads a newer version and restarts into it; resolves false when there is none or either step failed. */
	installUpdate: async () =>
		await rpc.request.installUpdate(undefined, {
			maxRequestTime: UPDATE_TIMEOUT_MS,
		}),
	/** Resolves false when the restart did not start. */
	applyUpdate: async () =>
		await rpc.request.applyUpdate(undefined, {
			maxRequestTime: UPDATE_TIMEOUT_MS,
		}),
	sendToMain: (message: DesktopHostMessage) => {
		rpc.send.pageMessage(message)
	},
}
