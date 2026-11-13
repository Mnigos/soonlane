import { saveCookie } from '@soonlane/analytics/cookie'
import { readCookie } from '@soonlane/domain'
import { PREFERENCE_COOKIE_MAX_AGE_MS } from './preference-cookie.constants'

const TODOIST_OFFER_COOKIE = 'soonlane-todoist-offer'

/** Whether the owner turned the Todoist offer down on this device; browser only. */
export function readTodoistOfferDismissed() {
	return readCookie(document.cookie, TODOIST_OFFER_COOKIE) === 'dismissed'
}

export async function saveTodoistOfferDismissed() {
	await saveCookie(
		TODOIST_OFFER_COOKIE,
		'dismissed',
		PREFERENCE_COOKIE_MAX_AGE_MS
	)
}
