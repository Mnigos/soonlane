import type { RepeatUnit } from '@soonlane/domain'

/** The Repeat menu's presets, each labelled from the due date. */
export const PRESET_REPEAT_UNITS = [
	'day',
	'week',
	'weekday',
	'month',
	'year',
] as const satisfies readonly RepeatUnit[]

/** The units of Custom's "Every [N] [unit]". */
export const CUSTOM_REPEAT_UNIT_LABELS = {
	day: 'days',
	week: 'weeks',
	month: 'months',
} as const satisfies Partial<Record<RepeatUnit, string>>

export type CustomRepeatUnit = keyof typeof CUSTOM_REPEAT_UNIT_LABELS

export function isCustomRepeatUnit(unit: string): unit is CustomRepeatUnit {
	return Object.hasOwn(CUSTOM_REPEAT_UNIT_LABELS, unit)
}
