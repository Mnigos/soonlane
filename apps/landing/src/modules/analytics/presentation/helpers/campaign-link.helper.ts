import type { MouseEvent } from 'react'
import { CAMPAIGN_PARAMS } from '../campaign-search.schema'

/**
 * Copies the page's campaign tags onto a link into the app as it is followed, so a visitor who answers the consent
 * banner only in the app still counts for the channel that sent them.
 */
export function carryCampaignParams({
	currentTarget,
}: MouseEvent<HTMLAnchorElement>) {
	const page = new URLSearchParams(location.search)
	const params = new URLSearchParams()

	for (const name of CAMPAIGN_PARAMS) {
		const value = page.get(name)

		if (value) params.set(name, value)
	}

	currentTarget.search = params.toString()
}
