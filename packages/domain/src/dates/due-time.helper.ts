import {
	DURATION_MINUTES_MAX,
	DURATION_MINUTES_MIN,
} from '../tasks/task.constants'

const MILLISECONDS_PER_MINUTE = 60_000
/** `HH:MM` within an ISO timestamp. */
const ISO_TIME_START = 11
const ISO_TIME_END = 16

export function isDurationInRange(minutes: number) {
	return (
		Number.isInteger(minutes) &&
		minutes >= DURATION_MINUTES_MIN &&
		minutes <= DURATION_MINUTES_MAX
	)
}

/**
 * The due time, or with a duration its range: "14:00–15:30", "23:30–00:30 next day".
 * `long` is the text for screen readers: "14:00 to 15:30".
 */
export function formatDueTime(
	dueTime: string,
	durationMinutes: number | undefined,
	width: 'long' | 'short' = 'short'
) {
	if (durationMinutes === undefined) return dueTime

	// Computed on 1 January 1970 in UTC, so the end never crosses a DST shift and any other day of month is the next day.
	const end = new Date(
		Date.parse(`1970-01-01T${dueTime}Z`) +
			durationMinutes * MILLISECONDS_PER_MINUTE
	)
	const range = `${dueTime}${width === 'long' ? ' to ' : '–'}${end.toISOString().slice(ISO_TIME_START, ISO_TIME_END)}`

	return end.getUTCDate() === 1 ? range : `${range} next day`
}
