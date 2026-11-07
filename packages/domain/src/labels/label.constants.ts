/** Todoist's palette, in Todoist's order. */
export const LABEL_COLORS = [
	'berry-red',
	'red',
	'orange',
	'yellow',
	'olive-green',
	'lime-green',
	'green',
	'mint-green',
	'teal',
	'sky-blue',
	'light-blue',
	'blue',
	'grape',
	'violet',
	'lavender',
	'magenta',
	'salmon',
	'charcoal',
	'grey',
	'taupe',
] as const

export type LabelColor = (typeof LABEL_COLORS)[number]

export const LABEL_NAME_MAX_LENGTH = 60
