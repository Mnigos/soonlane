export type OwnerCommand = 'approve' | 'request-changes'
export type ReviewVerdictEvent = 'APPROVE' | 'REQUEST_CHANGES'
export type CommandSourceKind = 'review' | 'comment'

export interface GitHubUser {
	id: number
	login: string
	type: string
}

export interface PullRequestRepository {
	full_name: string
}

export interface PullRequestHead {
	sha: string
	repo: PullRequestRepository | null
}

export interface PullRequestBase {
	repo: PullRequestRepository
}

export interface PullRequest {
	number: number
	state: string
	draft?: boolean
	user: GitHubUser | null
	head: PullRequestHead
	base: PullRequestBase
}

export interface PullRequestReview {
	id: number
	user: GitHubUser | null
	state: string
	body: string | null
	commit_id: string
	submitted_at?: string
	html_url: string
}

export interface IssueComment {
	id: number
	user: GitHubUser | null
	body?: string | null
	created_at: string
	updated_at: string
	html_url: string
}

export interface ReviewEventPullRequest {
	number: number
}

export interface IssueEventPullRequestLink {
	url: string
}

export interface CommentEventIssue {
	number: number
	pull_request?: IssueEventPullRequestLink | null
}

export interface OwnerReviewEventPayload {
	action?: string
	pull_request?: ReviewEventPullRequest
	review?: PullRequestReview
	issue?: CommentEventIssue
	comment?: IssueComment
	sender?: GitHubUser
}

export interface ActionsContext {
	eventName: string
	repository: string
	payload: OwnerReviewEventPayload
}

export interface CreateReviewInput {
	pullNumber: number
	commitId: string
	event: ReviewVerdictEvent
	body: string
}

export interface DismissReviewInput {
	pullNumber: number
	reviewId: number
	message: string
}

export interface OwnerReviewClient {
	getPull: (pullNumber: number) => Promise<PullRequest>
	listReviews: (pullNumber: number) => Promise<PullRequestReview[]>
	listIssueComments: (pullNumber: number) => Promise<IssueComment[]>
	createReview: (input: CreateReviewInput) => Promise<void>
	dismissReview: (input: DismissReviewInput) => Promise<void>
}

export interface CommandRun {
	client: OwnerReviewClient
	log: (message: string) => void
	pullNumber: number
}

/** An owner command or applied decision placed on the shared review/Conversation timeline. */
export interface CommandSource {
	kind: CommandSourceKind
	id: number
	command?: OwnerCommand
	time: number
}
