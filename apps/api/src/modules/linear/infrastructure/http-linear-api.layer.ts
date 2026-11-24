import { LINEAR_GRAPHQL_URL, type OAuthTokenKind } from '@soonlane/auth'
import { revokeLinearToken } from '@soonlane/auth/server'
import type { LinearIssue } from '@soonlane/contracts'
import { Effect, Layer, Option, Schema } from 'effect'
import { toErrorName } from '@/modules/analytics/domain/error-name.helper'
import { LinearApi } from '../application/linear-api.port'
import {
	LinearConnectionLapsed,
	LinearReadFailed,
} from '../domain/linear.errors'

const READ_TIMEOUT_MS = 10_000
const ASSIGNED_ISSUES_MAX = 50
const SEARCH_RESULTS_MAX = 20
/** A request Linear refused as the caller's own mistake, such as an issue id it does not know. */
const USER_ERROR = 'UserError'
const ISSUE_FIELDS = 'id identifier title url state { type color name }'
const decodeErrors = Schema.decodeUnknownOption(
	Schema.Struct({
		errors: Schema.Array(
			Schema.Struct({
				extensions: Schema.optional(
					Schema.Struct({
						code: Schema.optional(Schema.String),
						userError: Schema.optional(Schema.Boolean),
					})
				),
			})
		),
	})
)
const issueSchema = Schema.Struct({
	id: Schema.String,
	identifier: Schema.String,
	title: Schema.String,
	url: Schema.String,
	state: Schema.Struct({
		type: Schema.String,
		color: Schema.String,
		name: Schema.String,
	}),
})
const issueNodesSchema = Schema.Struct({ nodes: Schema.Array(issueSchema) })

function toIssue({ id, ...issue }: typeof issueSchema.Type): LinearIssue {
	return { issueId: id, ...issue }
}

/** One GraphQL read: a refused token is lapsed, a user error is `USER_ERROR`, and any other failure a short reason to log. */
function request<T>(
	accessToken: string,
	query: string,
	variables: Record<string, unknown>,
	data: Schema.Decoder<T>
) {
	return Effect.gen(function* () {
		const response = yield* Effect.tryPromise({
			try: async signal =>
				await fetch(LINEAR_GRAPHQL_URL, {
					method: 'POST',
					headers: {
						'Content-Type': 'application/json',
						Authorization: `Bearer ${accessToken}`,
					},
					body: JSON.stringify({ query, variables }),
					signal: AbortSignal.any([
						signal,
						AbortSignal.timeout(READ_TIMEOUT_MS),
					]),
				}),
			catch: toErrorName,
		})
		const json: unknown = yield* Effect.tryPromise({
			try: async () => await response.json(),
			catch: toErrorName,
		}).pipe(Effect.orElseSucceed(() => undefined))
		const codes = Option.match(decodeErrors(json), {
			onNone: () => [],
			onSome: ({ errors }) => errors.map(({ extensions }) => extensions),
		})

		// Linear answers a revoked or expired token with 401, or with a GraphQL `AUTHENTICATION_ERROR`.
		if (
			response.status === 401 ||
			codes.some(extensions => extensions?.code === 'AUTHENTICATION_ERROR')
		)
			return yield* new LinearConnectionLapsed()
		if (codes.some(extensions => extensions?.userError === true))
			return yield* Effect.fail(USER_ERROR)
		if (!response.ok || codes.length > 0)
			return yield* Effect.fail(String(response.status))

		const decoded = yield* Schema.decodeUnknownEffect(Schema.Struct({ data }))(
			json
		).pipe(Effect.mapError(() => 'UnexpectedResponse'))

		return decoded.data
	})
}

/** Logs a failure's short reason and reports it as `LinearReadFailed`. */
function toRead<T>(
	span: string,
	read: Effect.Effect<T, string | LinearConnectionLapsed>
) {
	return read.pipe(
		Effect.withSpan(span),
		Effect.tapError(reason =>
			typeof reason === 'string'
				? Effect.logWarning('Linear read failed', reason)
				: Effect.void
		),
		Effect.mapError(reason =>
			typeof reason === 'string' ? new LinearReadFailed() : reason
		)
	)
}

export const HttpLinearApiLive = Layer.succeed(
	LinearApi,
	LinearApi.of({
		readWorkspaceName: accessToken =>
			toRead(
				'LinearApi.readWorkspaceName',
				request(
					accessToken,
					'{ viewer { organization { name } } }',
					{},
					Schema.Struct({
						viewer: Schema.Struct({
							organization: Schema.Struct({ name: Schema.String }),
						}),
					})
				).pipe(Effect.map(({ viewer }) => viewer.organization.name))
			),
		listAssignedIssues: accessToken =>
			toRead(
				'LinearApi.listAssignedIssues',
				request(
					accessToken,
					`query ($first: Int) { viewer { assignedIssues(first: $first, orderBy: updatedAt, filter: { state: { type: { nin: ["completed", "canceled"] } } }) { nodes { ${ISSUE_FIELDS} } } } }`,
					{ first: ASSIGNED_ISSUES_MAX },
					Schema.Struct({
						viewer: Schema.Struct({ assignedIssues: issueNodesSchema }),
					})
				).pipe(
					Effect.map(({ viewer }) => viewer.assignedIssues.nodes.map(toIssue))
				)
			),
		searchIssues: (accessToken, term) =>
			toRead(
				'LinearApi.searchIssues',
				request(
					accessToken,
					`query ($term: String!, $first: Int) { searchIssues(term: $term, first: $first) { nodes { ${ISSUE_FIELDS} } } }`,
					{ term, first: SEARCH_RESULTS_MAX },
					Schema.Struct({ searchIssues: issueNodesSchema })
				).pipe(
					Effect.map(({ searchIssues }) => searchIssues.nodes.map(toIssue))
				)
			),
		findIssue: (accessToken, idOrIdentifier) =>
			toRead(
				'LinearApi.findIssue',
				request(
					accessToken,
					`query ($id: String!) { issue(id: $id) { ${ISSUE_FIELDS} } }`,
					{ id: idOrIdentifier },
					Schema.Struct({ issue: Schema.NullOr(issueSchema) })
				).pipe(
					Effect.map(({ issue }) => (issue ? toIssue(issue) : undefined)),
					Effect.catchIf(
						reason => reason === USER_ERROR,
						() => Effect.succeed(undefined)
					)
				)
			),
		listIssues: (accessToken, ids) =>
			toRead(
				'LinearApi.listIssues',
				request(
					accessToken,
					`query ($ids: [ID!], $first: Int) { issues(first: $first, filter: { id: { in: $ids } }) { nodes { ${ISSUE_FIELDS} } } }`,
					{ ids, first: ids.length },
					Schema.Struct({ issues: issueNodesSchema })
				).pipe(Effect.map(({ issues }) => issues.nodes.map(toIssue)))
			),
		revoke: Effect.fn('LinearApi.revoke')(
			(token: string, kind: OAuthTokenKind) =>
				Effect.promise(async () => await revokeLinearToken(token, kind)).pipe(
					Effect.tap(reason =>
						reason === undefined
							? Effect.void
							: Effect.logWarning('Linear revoke failed', reason)
					),
					Effect.map(reason => reason === undefined)
				)
		),
	})
)
