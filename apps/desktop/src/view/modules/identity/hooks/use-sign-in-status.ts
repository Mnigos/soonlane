import { useSyncExternalStore } from 'react'
import { desktopHost } from '../../../platform/rpc/desktop-host.client'

export function useSignInStatus() {
	return useSyncExternalStore(
		desktopHost.subscribe,
		desktopHost.getSignInStatus
	)
}
