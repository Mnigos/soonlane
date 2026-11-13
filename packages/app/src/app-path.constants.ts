/** The paths both host apps serve; every link in this package goes through them. */
export const APP_PATHS = {
	inbox: '/inbox',
	upcoming: '/',
	today: '/today',
	search: '/search',
	completed: '/completed',
	label: '/labels/$name',
	project: '/projects/$name',
	quickAdd: '/quick-add',
} as const
