import { execFile } from 'node:child_process'
import { readFile } from 'node:fs/promises'
import { promisify } from 'node:util'
import { applyCommentCommand, applyReviewCommand } from './owner-review.handler'
import { REPOSITORIES } from './owner-review.policy'
import type {
	ActionsContext,
	IssueComment,
	OwnerReviewClient,
	PullRequestReview,
} from './owner-review.types'
import { dismissStaleApprovals } from './stale-approvals.handler'

const GH_MAX_BUFFER = 64 * 1024 * 1024

/** Returns the pull request number of a supported event, ignoring comments on ordinary issues. */
function getEventPullNumber({ eventName, payload }: ActionsContext) {
	if (eventName === 'issue_comment')
		return payload.issue?.pull_request ? payload.issue.number : undefined

	return payload.pull_request?.number
}

export interface RunOwnerReviewCommandsOptions {
	client: OwnerReviewClient
	context: ActionsContext
	log?: (message: string) => void
}

/** Applies owner review or Conversation commands and dismisses stale command approvals for one GitHub event. */
export async function runOwnerReviewCommands({
	client,
	context,
	log = console.info,
}: RunOwnerReviewCommandsOptions) {
	const { eventName, payload } = context
	const logOnly = (reason: string) => log(`Skipped: ${reason}`)

	if (!REPOSITORIES.has(context.repository.toLowerCase()))
		return logOnly('unsupported repository')

	const pullNumber = getEventPullNumber(context)

	if (!pullNumber) return logOnly('missing pull request')

	const run = { client, log, pullNumber }

	if (eventName === 'pull_request_target' && payload.action === 'synchronize')
		return await dismissStaleApprovals(run)
	if (eventName === 'pull_request_review' && payload.action === 'submitted')
		return await applyReviewCommand(run, payload.review, payload.sender)
	if (eventName === 'issue_comment' && payload.action === 'created')
		return await applyCommentCommand(run, payload.comment, payload.sender)

	return logOnly('unsupported event')
}

const execFileAsync = promisify(execFile)

async function callGitHubApi(args: string[]) {
	const { stdout } = await execFileAsync('gh', ['api', ...args], {
		encoding: 'utf-8',
		maxBuffer: GH_MAX_BUFFER,
	})
	return stdout
}

/** Reads every page of a list endpoint through `gh api --paginate --slurp`. */
async function listAllPages<TItem>(path: string) {
	const pages: TItem[][] = JSON.parse(
		await callGitHubApi([`${path}?per_page=100`, '--paginate', '--slurp'])
	)
	return pages.flat()
}

/** Creates a `gh api` client scoped to one repository's pull requests. */
export function createGhClient(repository: string): OwnerReviewClient {
	const pullsPath = `repos/${repository}/pulls`

	return {
		getPull: async pullNumber =>
			JSON.parse(await callGitHubApi([`${pullsPath}/${pullNumber}`])),
		listReviews: async pullNumber =>
			await listAllPages<PullRequestReview>(
				`${pullsPath}/${pullNumber}/reviews`
			),
		listIssueComments: async pullNumber =>
			await listAllPages<IssueComment>(
				`repos/${repository}/issues/${pullNumber}/comments`
			),
		createReview: async ({ pullNumber, commitId, event, body }) => {
			await callGitHubApi([
				`${pullsPath}/${pullNumber}/reviews`,
				'--method',
				'POST',
				'--raw-field',
				`commit_id=${commitId}`,
				'--raw-field',
				`event=${event}`,
				'--raw-field',
				`body=${body}`,
			])
		},
		dismissReview: async ({ pullNumber, reviewId, message }) => {
			await callGitHubApi([
				`${pullsPath}/${pullNumber}/reviews/${reviewId}/dismissals`,
				'--method',
				'PUT',
				'--raw-field',
				`message=${message}`,
				'--raw-field',
				'event=DISMISS',
			])
		},
	}
}

/** Reads the GitHub Actions event context from runner environment variables. */
export async function readActionsContext(
	env: NodeJS.ProcessEnv = process.env
): Promise<ActionsContext> {
	const { GITHUB_EVENT_NAME, GITHUB_EVENT_PATH, GITHUB_REPOSITORY } = env
	if (!GITHUB_EVENT_NAME || !GITHUB_EVENT_PATH || !GITHUB_REPOSITORY)
		throw new Error(
			'GITHUB_EVENT_NAME, GITHUB_EVENT_PATH and GITHUB_REPOSITORY are required'
		)

	return {
		eventName: GITHUB_EVENT_NAME,
		repository: GITHUB_REPOSITORY,
		payload: JSON.parse(await readFile(GITHUB_EVENT_PATH, 'utf-8')),
	}
}

if (import.meta.main) {
	const context = await readActionsContext()
	await runOwnerReviewCommands({
		client: createGhClient(context.repository),
		context,
	})
}
