import type { RPCSchema } from 'electrobun'

/**
 * What the bundled page and the main process say over Electrobun's typed RPC
 * (a loopback WebSocket, encrypted per webview). The desktop token stays in the
 * main process and the page's memory; the page never stores it.
 */
export interface PageRpcSchema {
	bun: RPCSchema<{
		requests: {
			/** The desktop token from the Keychain, or `null` when signed out. */
			readToken: { params: undefined; response: string | null }
			/** Opens the sign-in in the system browser. */
			signIn: { params: undefined; response: undefined }
			/** Revokes the desktop session and forgets the token. */
			signOut: { params: undefined; response: undefined }
		}
		messages: Record<never, never>
	}>
	webview: RPCSchema<{
		requests: Record<never, never>
		messages: {
			/** The token after a sign-in or sign-out, whichever window started it. */
			tokenChanged: { token: string | null }
			/** A sign-in ended without a token: the browser did not open, the wait ran out or the exchange failed. */
			signInFailed: undefined
		}
	}>
}
