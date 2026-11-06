export const REPEAT_UNITS = ['day', 'weekday', 'week', 'month', 'year'] as const

export type RepeatUnit = (typeof REPEAT_UNITS)[number]

/** Every weekday and every year have no "every N" form. */
export const SINGLE_INTERVAL_REPEAT_UNITS: readonly RepeatUnit[] = [
	'weekday',
	'year',
]

export const REPEAT_INTERVAL_MAX = 99
