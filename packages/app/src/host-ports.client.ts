import type { ClientEvents } from '@soonlane/analytics'

/** What the shared hooks need from the host app outside React; none of it may touch the DOM here, so a native host can provide it. */
interface HostPorts {
	showToast: (
		message: string,
		options?: {
			/** A toast with the same id replaces the shown one. */
			id?: string
			action?: { label: string; onClick: () => void }
		}
	) => void
	dismissToast: (id: string) => void
	capture: <TEvent extends keyof ClientEvents>(
		event: TEvent,
		properties: ClientEvents[TEvent]
	) => void
	/** Calls back when the app may have slept, such as a tab or app returning to the foreground; returns the unsubscribe. */
	subscribeToResume: (onResume: () => void) => () => void
}

let hostPorts: HostPorts | undefined

/** The host app hands these over once at startup, before anything renders. */
export function provideHostPorts(ports: HostPorts) {
	hostPorts = ports
}

export function getHostPorts() {
	if (!hostPorts)
		throw new Error('Call provideHostPorts before the first render.')

	return hostPorts
}
