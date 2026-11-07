import type {
	CommandRun,
	GitHubUser,
	OwnerCommand,
	PullRequest,
	PullRequestReview,
	ReviewVerdictEvent,
} from './owner-review.types'

export const OWNER_ID = 56_691_628
export const REPOSITORY = 'mnigos/soonlane'
export const BOT_LOGIN = 'github-actions[bot]'
export const MARKER_PREFIX = '<!-- owner-review-command:'
export const DISMISS_MESSAGE = 'New commits require a fresh /approve.'
const COMMAND_PATTERN = /^ {0,3}\/(approve|request-changes)\s*$/u
const FENCE_PATTERN = /^ {0,3}(`{3,}|~{3,})(.*)$/u

interface CommandReview {
	event: ReviewVerdictEvent
	state: string
}

export const COMMANDS = {
	approve: { event: 'APPROVE', state: 'APPROVED' },
	'request-changes': { event: 'REQUEST_CHANGES', state: 'CHANGES_REQUESTED' },
} as const satisfies Record<OwnerCommand, CommandReview>

export const BOT_VERDICT_COMMANDS = {
	APPROVED: 'approve',
	CHANGES_REQUESTED: 'request-changes',
	DISMISSED: undefined,
} as const satisfies Record<string, OwnerCommand | undefined>

/** Narrows a parsed command name to a known owner command. */
function isOwnerCommand(value: string | undefined): value is OwnerCommand {
	return value !== undefined && Object.hasOwn(COMMANDS, value)
}

/** Returns the owner command a bot verdict review stands for, if any. */
export function getBotVerdictCommand(state: string): OwnerCommand | undefined {
	if (state === 'APPROVED') return 'approve'
	if (state === 'CHANGES_REQUESTED') return 'request-changes'

	return undefined
}

/** Logs why the current run made no review change. */
export function skip(run: CommandRun, reason: string) {
	run.log(`Skipped: ${reason}`)
}

/** Returns the single standalone owner command in a review or comment body, ignoring fenced code. */
export function parseCommand(body: string | null | undefined) {
	const commands = new Set<OwnerCommand>()
	const fence: { open?: string } = {}

	for (const line of (body ?? '').split(/\r?\n/u)) {
		const fenceMatch = FENCE_PATTERN.exec(line)

		if (fence.open) {
			const [, marker, rest] = fenceMatch ?? []
			const closesFence =
				marker?.startsWith(fence.open.charAt(0)) &&
				marker.length >= fence.open.length &&
				rest?.trim() === ''

			if (closesFence) fence.open = undefined
			continue
		}

		if (fenceMatch) {
			;[, fence.open] = fenceMatch
			continue
		}

		const match = COMMAND_PATTERN.exec(line)
		const command = match?.[1]

		if (isOwnerCommand(command)) commands.add(command)
	}

	return commands.size === 1 ? [...commands][0] : undefined
}

/** Checks the numeric owner ID and rejects bot or organization accounts. */
export function isOwnerUser(user: GitHubUser | null | undefined) {
	return user?.id === OWNER_ID && user.type === 'User'
}

/** Checks for a submitted owner review that can carry a command. */
export function isOwnerCommentReview(review: PullRequestReview) {
	return isOwnerUser(review.user) && review.state.toUpperCase() === 'COMMENTED'
}

/** Checks for a review written by this workflow's token. */
export function isBotReview(review: PullRequestReview) {
	return review.user?.login === BOT_LOGIN && review.user.type === 'Bot'
}

/** Returns why a live pull request must not receive owner review commands. */
export function getPullSkipReason(pull: PullRequest) {
	if (pull.state !== 'open' || pull.draft)
		return 'pull request is not open and ready'
	if (!isOwnerUser(pull.user)) return 'pull request is not authored by owner'
	if (
		pull.base.repo.full_name.toLowerCase() !== REPOSITORY ||
		pull.head.repo?.full_name !== pull.base.repo.full_name
	)
		return 'pull request head is not in the base repository'

	return undefined
}
