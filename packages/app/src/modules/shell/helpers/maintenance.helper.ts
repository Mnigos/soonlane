import { MAINTENANCE_ERROR } from '@soonlane/contracts'
import { getHostPorts } from '../../../host-ports.client'

/** oRPC errors and Better Auth's error objects both carry the code the API refuses calls with during maintenance. */
function isRefusedForMaintenance(error: unknown) {
	return (
		typeof error === 'object' &&
		error !== null &&
		'code' in error &&
		error.code === MAINTENANCE_ERROR.code
	)
}

/** The maintenance notice for a refused call, `fallback` for any other failure. */
export function describeFailure(error: unknown, fallback: string) {
	return isRefusedForMaintenance(error) ? MAINTENANCE_ERROR.message : fallback
}

/** Toasts a failed change; refused changes share one toast, so a burst of them shows a single notice. */
export function toastFailure(error: unknown, fallback: string) {
	const { showToast } = getHostPorts()

	if (isRefusedForMaintenance(error))
		showToast(MAINTENANCE_ERROR.message, { id: MAINTENANCE_ERROR.code })
	else showToast(fallback)
}
