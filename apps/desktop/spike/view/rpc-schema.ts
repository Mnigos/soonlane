import type { RPCSchema } from 'electrobun/view'

/** SPIKE SOON-141: what the page and the main process say to each other. */
export interface SpikeRpc {
	bun: RPCSchema<{
		requests: {
			getSessionToken: { params: undefined; response: string | null }
		}
		messages: { report: { step: string; data: unknown } }
	}>
	webview: RPCSchema<{
		requests: Record<never, never>
		messages: Record<never, never>
	}>
}
