/** Todoist's palette keys in Todoist's order. */
export const LABEL_COLORS = [
	'berry_red',
	'red',
	'orange',
	'yellow',
	'olive_green',
	'lime_green',
	'green',
	'mint_green',
	'teal',
	'sky_blue',
	'light_blue',
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
