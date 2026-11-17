import { toast } from 'sonner'
import { desktopHost } from '../../../../platform/rpc/desktop-host.client'
import { UPDATE_COPY } from './update-copy.constants'

/** Restarts into the downloaded update, or says so when the app keeps running. */
async function applyUpdate() {
	const hasStarted = await desktopHost.applyUpdate().catch(() => false)

	if (!hasStarted)
		toast.error(UPDATE_COPY.applyFailedToast, {
			description: UPDATE_COPY.applyFailedDescription,
		})
}

/** Offers "Restart to update" in a toast whenever an update waits, already at launch included. */
export function offerUpdateRestart() {
	desktopHost.onUpdateReady(() => {
		toast(UPDATE_COPY.readyToast, {
			id: 'update-ready',
			duration: Number.POSITIVE_INFINITY,
			action: {
				label: UPDATE_COPY.readyAction,
				onClick: () => void applyUpdate(),
			},
		})
	})
}
