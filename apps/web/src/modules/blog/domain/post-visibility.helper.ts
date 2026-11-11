interface PostSchedule {
	draft: boolean
	date: string
}

/** Both dates are ISO days (YYYY-MM-DD), so string order is date order. */
export function isPostPublished({ draft, date }: PostSchedule, today: string) {
	return !draft && date <= today
}
