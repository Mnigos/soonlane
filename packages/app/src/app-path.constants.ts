/** The paths both host apps serve; every link in this package goes through them. */
export const APP_PATHS = {
	inbox: '/app/inbox',
	upcoming: '/app',
	today: '/app/today',
	search: '/app/search',
	label: '/app/labels/$name',
	project: '/app/projects/$name',
	quickAdd: '/app/quick-add',
} as const
