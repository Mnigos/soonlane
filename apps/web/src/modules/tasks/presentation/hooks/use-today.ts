import type { CalendarDate } from '@soonlist/domain'
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

const getSnapshot = () => getToday(new Date())

// The server cannot know the user's time zone, so SSR renders without a date and the browser fills it in after hydration.
const getServerSnapshot = () => undefined

/** Today in the browser's time zone; undefined during SSR and hydration. */
export function useToday(): CalendarDate | undefined {
	return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
}
