import {
	type CalendarDate,
	getMillisecondsUntilTomorrow,
	getToday,
} from '@soonlane/domain'
import { useSyncExternalStore } from 'react'
import { getHostPorts } from '../../../host-ports.client'

/** Re-reads the date at local midnight and when the app resumes, since timers stall while a device sleeps. */
function subscribe(onChange: () => void) {
	const midnight: { timer?: ReturnType<typeof setTimeout> } = {}

	function scheduleMidnight() {
		midnight.timer = setTimeout(() => {
			onChange()
			scheduleMidnight()
		}, getMillisecondsUntilTomorrow(new Date()))
	}

	scheduleMidnight()
	const unsubscribeFromResume = getHostPorts().subscribeToResume(onChange)

	return () => {
		clearTimeout(midnight.timer)
		unsubscribeFromResume()
	}
}

const readLocalToday = () => getToday(new Date())

/** The user's time zone is unknown during SSR, so SSR and hydration render without a date and the local clock fills it in afterwards. */
const getUnknownToday = () => undefined

/** Today in the device's time zone; undefined during SSR and hydration. */
export function useToday(): CalendarDate | undefined {
	return useSyncExternalStore(subscribe, readLocalToday, getUnknownToday)
}
