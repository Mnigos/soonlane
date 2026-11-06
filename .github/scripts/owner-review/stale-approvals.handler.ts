import {
	DISMISS_MESSAGE,
	getPullSkipReason,
	isBotReview,
	MARKER_PREFIX,
	skip,
} from './owner-review.policy'
import type { CommandRun } from './owner-review.types'

/** Dismisses marked bot approvals whose reviewed commit is no longer the live head. */
export async function dismissStaleApprovals(run: CommandRun) {
	const { client, pullNumber } = run
	const pull = await client.getPull(pullNumber)
	const pullSkipReason = getPullSkipReason(pull)

	if (pullSkipReason) return skip(run, pullSkipReason)

	const reviews = await client.listReviews(pullNumber)
	const livePull = await client.getPull(pullNumber)
	const livePullSkipReason = getPullSkipReason(livePull)

	if (livePullSkipReason) return skip(run, livePullSkipReason)
	if (livePull.head.sha !== pull.head.sha)
		return skip(run, 'pull request head changed')

	const staleApprovals = reviews.filter(
		review =>
			isBotReview(review) &&
			review.state === 'APPROVED' &&
			review.body?.includes(MARKER_PREFIX) &&
			review.commit_id !== livePull.head.sha
	)

	if (staleApprovals.length === 0)
		return skip(run, 'no stale owner command approvals')

	for (const approval of staleApprovals) {
		await client.dismissReview({
			pullNumber,
			reviewId: approval.id,
			message: DISMISS_MESSAGE,
		})
		run.log(`Dismissed approval ${approval.id} for ${approval.commit_id}`)
	}
}
