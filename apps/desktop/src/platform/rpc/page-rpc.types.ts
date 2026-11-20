import type { DesktopHostMessage } from '@soonlane/app/shell/helpers/desktop-host.helper'
import type {
	AccountDeletion,
	DeletingAccount,
} from '../../modules/identity/domain/account-deletion.types'

/**
 * What the bundled page and the main process say over Electrobun's typed RPC
 * (a loopback WebSocket, encrypted per webview). The desktop token stays in the
 * main process and the page's memory; the page never stores it. Both sides are
 * plain `{ requests, messages }` objects, the shape Electrobun's `RPCSchema`
 * resolves to, so the page's program reads this file without the main SDK.
 */
export interface PageRpcSchema {
	bun: {
		requests: {
			/** The desktop token from the Keychain, or `null` when signed out. */
			readToken: { params: undefined; response: string | null }
			/** Opens the sign-in in the system browser. */
			signIn: { params: undefined; response: undefined }
			/** Revokes the desktop session and forgets the token. */
			signOut: { params: undefined; response: undefined }
			/** Deletes the account of `userId` if the token is still that user's and its session is fresh; after a deletion the main process forgets the token. */
			deleteAccount: { params: { userId: string }; response: AccountDeletion }
			/** Opens a fresh sign-in in the system browser for a deletion that asked for one; the page that loads with the new token takes the account back with `takeDeletionReturn`. */
			signInToDelete: { params: DeletingAccount; response: undefined }
			/** The account the last sign-in was started to delete, once per sign-in, or `null`. */
			takeDeletionReturn: {
				params: undefined
				response: DeletingAccount | null
			}
			/** Whether a downloaded update waits for a restart, for a page that loads after `updateReady`. */
			isUpdateReady: { params: undefined; response: boolean }
			/** Downloads a newer version and restarts into it; false when there is none or either step failed. */
			installUpdate: { params: undefined; response: boolean }
			/** Restarts into the update that `updateReady` announced; false when the restart did not start. */
			applyUpdate: { params: undefined; response: boolean }
		}
		messages: {
			/** Quick Add closing or growing, and the Dock badge count; the main process decodes each before acting on it. */
			pageMessage: DesktopHostMessage
		}
	}
	webview: {
		requests: Record<never, never>
		messages: {
			/** The token after a sign-in or sign-out, whichever window started it. */
			tokenChanged: { token: string | null }
			/** A sign-in ended without a token: the browser did not open, the wait ran out or the exchange failed. */
			signInFailed: undefined
			/** A downloaded update waits for a restart. */
			updateReady: undefined
		}
	}
}
