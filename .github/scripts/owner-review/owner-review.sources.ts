import {
	getBotVerdictCommand,
	isBotReview,
	isOwnerCommentReview,
	isOwnerUser,
	MARKER_PREFIX,
	parseCommand,
} from './owner-review.policy'
import type {
	CommandSource,
	CommandSourceKind,
	IssueComment,
	PullRequestReview,
} from './owner-review.types'

const MARKER_PATTERN =
	/<!-- owner-review-command:(?:(review|comment):)?(\d+) -->/gu

interface SourceIdentity {
	kind: CommandSourceKind
	id: number
}

/** Builds the stable key that identifies one review or Conversation comment source. */
export const toSourceKey = ({ kind, id }: SourceIdentity) => `${kind}:${id}`

/** Builds the hidden bot review marker that consumes one command source. */
export const toSourceMarker = (source: SourceIdentity) =>
	`${MARKER_PREFIX}${toSourceKey(source)} -->`

const toTime = (timestamp: string | undefined) => Date.parse(timestamp ?? '')

/** Reads consumed sources from a bot review body; legacy markers without a kind name reviews. */
function readMarkerSources(body: string | null) {
	return [...(body ?? '').matchAll(MARKER_PATTERN)].map(
		([, kind = 'review', id]): SourceIdentity => ({
			kind: kind === 'comment' ? 'comment' : 'review',
			id: Number(id),
		})
	)
}

/** Places a submitted owner review on the shared timeline by its submission time. */
export const toReviewSource = (review: PullRequestReview): CommandSource => ({
	kind: 'review',
	id: review.id,
	command: parseCommand(review.body),
	time: toTime(review.submitted_at),
})

/** Places an owner Conversation comment on the shared timeline by its creation time. */
export const toCommentSource = (comment: IssueComment): CommandSource => ({
	kind: 'comment',
	id: comment.id,
	command: parseCommand(comment.body),
	time: toTime(comment.created_at),
})

interface LiveSources {
	reviews: PullRequestReview[]
	comments: IssueComment[]
}

/** Collects every live owner command, edited or not, from reviews and Conversation comments. */
function collectOwnerCommands({ reviews, comments }: LiveSources) {
	return [
		...reviews.filter(isOwnerCommentReview).map(toReviewSource),
		...comments
			.filter(comment => isOwnerUser(comment.user))
			.map(toCommentSource),
	].filter(source => source.command !== undefined)
}

/** Collects sources consumed by bot reviews; missing sources fall back to the bot review time. */
function collectConsumedSources({ reviews, comments }: LiveSources) {
	const liveSources = new Map<string, CommandSource>(
		[
			...reviews.filter(review => isOwnerUser(review.user)).map(toReviewSource),
			...comments
				.filter(comment => isOwnerUser(comment.user))
				.map(toCommentSource),
		].map(source => [toSourceKey(source), source])
	)

	return reviews.filter(isBotReview).flatMap(review =>
		readMarkerSources(review.body).map(
			source =>
				liveSources.get(toSourceKey(source)) ?? {
					...source,
					command: getBotVerdictCommand(review.state),
					time: toTime(review.submitted_at),
				}
		)
	)
}

/** Returns live command and consumed sources plus the keys already applied by this workflow. */
export function collectTimeline(sources: LiveSources) {
	const consumed = collectConsumedSources(sources)

	return {
		consumedKeys: new Set(consumed.map(toSourceKey)),
		timeline: [...collectOwnerCommands(sources), ...consumed],
	}
}

/** Returns why a trigger is not the newest unambiguous owner decision on the shared timeline. */
export function getSupersededReason(
	trigger: CommandSource,
	timeline: CommandSource[]
) {
	const triggerKey = toSourceKey(trigger)

	if (Number.isNaN(trigger.time)) return 'command timestamp is unknown'

	for (const source of timeline) {
		if (toSourceKey(source) === triggerKey) continue
		if (Number.isNaN(source.time)) return 'owner command timestamp is unknown'
		if (source.time > trigger.time) return 'newer owner command exists'
		if (source.time === trigger.time && source.command !== trigger.command)
			return 'conflicting owner commands share a timestamp'
	}

	return undefined
}
