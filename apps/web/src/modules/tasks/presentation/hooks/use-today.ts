import type { CalendarDate } from '@soonlane/domain'
import { useSyncExternalStore } from 'react'
import {
	getMillisecondsUntilTomorrow,
	getToday,
} from '../../domain/calendar-date.helper'

// Re-reads the date at local midnight and when the tab returns, since timers stall while a laptop sleeps.
function subscribe(onChange: () => void) {
	let timer: ReturnType<typeof setTimeout>

	function scheduleMidnight() {
		timer = setTimeout(() => {
			onChange()
			scheduleMidnight()
		}, getMillisecondsUntilTomorrow(new Date()))
	}

	scheduleMidnight()
	document.addEventListener('visibilitychange', onChange)

	return () => {
		clearTimeout(timer)
		document.removeEventListener('visibilitychange', onChange)
	}
}

const readLocalToday = () => getToday(new Date())

// The user's time zone is unknown during SSR, so SSR and hydration render without a date and the local clock fills it in afterwards.
const getUnknownToday = () => undefined

/** Today in the browser's time zone; undefined during SSR and hydration. */
export function useToday(): CalendarDate | undefined {
	return useSyncExternalStore(subscribe, readLocalToday, getUnknownToday)
}
