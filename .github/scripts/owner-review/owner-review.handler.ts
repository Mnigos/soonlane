import {
	BOT_VERDICT_COMMANDS,
	COMMANDS,
	getPullSkipReason,
	isBotReview,
	isOwnerCommentReview,
	isOwnerUser,
	parseCommand,
	skip,
} from './owner-review.policy'
import {
	collectTimeline,
	getSupersededReason,
	toCommentSource,
	toReviewSource,
	toSourceKey,
	toSourceMarker,
} from './owner-review.sources'
import type {
	CommandRun,
	CommandSource,
	GitHubUser,
	IssueComment,
	OwnerCommand,
	PullRequest,
	PullRequestReview,
} from './owner-review.types'
import { dismissStaleApprovals } from './stale-approvals.handler'

interface LiveState {
	pull: PullRequest
	reviews: PullRequestReview[]
	comments: IssueComment[]
}

interface CommandTrigger {
	source: CommandSource
	command: OwnerCommand
	htmlUrl: string
}

type TriggerResolution = CommandTrigger | string

function byDecisionOrder(left: PullRequestReview, right: PullRequestReview) {
	return (
		Date.parse(left.submitted_at ?? '') -
			Date.parse(right.submitted_at ?? '') || left.id - right.id
	)
}

/** Validates the live copy of the triggering review against its submitted payload and current head. */
function resolveReviewTrigger(
	eventReview: PullRequestReview,
	{ pull, reviews }: LiveState
): TriggerResolution {
	const review = reviews.find(item => item.id === eventReview.id)

	if (!review || !isOwnerCommentReview(review))
		return 'command review is no longer eligible'
	if (review.body !== eventReview.body) return 'command review was edited'

	const command = parseCommand(review.body)

	if (!command) return 'command review is no longer eligible'
	if (review.commit_id !== pull.head.sha)
		return 'command review is not for the current head'

	return { source: toReviewSource(review), command, htmlUrl: review.html_url }
}

/** Validates the live copy of the triggering Conversation comment; edits and deletions fail closed. */
function resolveCommentTrigger(
	eventComment: IssueComment,
	{ comments }: LiveState
): TriggerResolution {
	const comment = comments.find(item => item.id === eventComment.id)

	if (!comment) return 'command comment was deleted'
	if (!isOwnerUser(comment.user)) return 'command comment is not by owner'
	if (
		Date.parse(comment.updated_at) !== Date.parse(comment.created_at) ||
		comment.created_at !== eventComment.created_at ||
		comment.body !== eventComment.body
	)
		return 'command comment was edited'

	const command = parseCommand(comment.body)

	if (!command) return 'no owner command'

	return {
		source: toCommentSource(comment),
		command,
		htmlUrl: comment.html_url,
	}
}

/** Submits the trigger's native verdict when it is the newest unconsumed owner decision. */
async function applyNewestCommand(
	run: CommandRun,
	resolveTrigger: (state: LiveState) => TriggerResolution
) {
	const { client, pullNumber } = run
	const pull = await client.getPull(pullNumber)
	const pullSkipReason = getPullSkipReason(pull)

	if (pullSkipReason) return skip(run, pullSkipReason)

	const [reviews, comments] = await Promise.all([
		client.listReviews(pullNumber),
		client.listIssueComments(pullNumber),
	])
	const trigger = resolveTrigger({ pull, reviews, comments })

	if (typeof trigger === 'string') return skip(run, trigger)

	const { consumedKeys, timeline } = collectTimeline({ reviews, comments })

	if (consumedKeys.has(toSourceKey(trigger.source)))
		return skip(run, 'command already applied')

	const supersededReason = getSupersededReason(trigger.source, timeline)

	if (supersededReason) return skip(run, supersededReason)

	const { event, state } = COMMANDS[trigger.command]
	const latestBotVerdict = reviews
		.filter(
			review =>
				isBotReview(review) && Object.hasOwn(BOT_VERDICT_COMMANDS, review.state)
		)
		.toSorted(byDecisionOrder)
		.at(-1)

	if (
		trigger.source.kind === 'review' &&
		latestBotVerdict?.state === state &&
		latestBotVerdict.commit_id === pull.head.sha
	)
		return skip(run, 'review state already applied')

	const livePull = await client.getPull(pullNumber)
	const livePullSkipReason = getPullSkipReason(livePull)

	if (livePullSkipReason) return skip(run, livePullSkipReason)
	if (livePull.head.sha !== pull.head.sha)
		return skip(run, 'pull request head changed')

	await client.createReview({
		pullNumber,
		commitId: pull.head.sha,
		event,
		body: `Submitted for @${livePull.user?.login} via ${trigger.htmlUrl}\n\n${toSourceMarker(trigger.source)}`,
	})
	run.log(
		`Submitted ${event} for ${pull.head.sha} from ${toSourceKey(trigger.source)}`
	)
}

/** Applies a submitted owner Comment review command after cleaning stale approvals. */
export async function applyReviewCommand(
	run: CommandRun,
	review: PullRequestReview | undefined,
	sender: GitHubUser | undefined
) {
	if (!isOwnerUser(sender)) return skip(run, 'unsupported sender')
	if (!review || !isOwnerCommentReview(review))
		return skip(run, 'unsupported review')

	await dismissStaleApprovals(run)

	if (!parseCommand(review.body)) return skip(run, 'no owner command')

	return await applyNewestCommand(run, state =>
		resolveReviewTrigger(review, state)
	)
}

/** Applies a new owner Conversation comment command to the head live at processing time. */
export async function applyCommentCommand(
	run: CommandRun,
	comment: IssueComment | undefined,
	sender: GitHubUser | undefined
) {
	if (!isOwnerUser(sender)) return skip(run, 'unsupported sender')
	if (!comment || !isOwnerUser(comment.user))
		return skip(run, 'unsupported comment')

	await dismissStaleApprovals(run)

	if (!parseCommand(comment.body)) return skip(run, 'no owner command')

	return await applyNewestCommand(run, state =>
		resolveCommentTrigger(comment, state)
	)
}
