/** The paths both host apps serve; every link in this package goes through them. */
export const APP_PATHS = {
	upcoming: '/app',
	today: '/app/today',
	label: '/app/labels/$name',
	quickAdd: '/app/quick-add',
} as const
