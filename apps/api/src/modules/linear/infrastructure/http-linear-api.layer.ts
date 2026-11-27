import { LINEAR_GRAPHQL_URL, type OAuthTokenKind } from '@soonlane/auth'
import { revokeLinearToken } from '@soonlane/auth/server'
import { Effect, Layer, Option, Schema } from 'effect'
import { toErrorName } from '@/modules/analytics/domain/error-name.helper'
import { LinearApi } from '../application/linear-api.port'
import {
	LinearConnectionLapsed,
	LinearReadFailed,
} from '../domain/linear.errors'

const READ_TIMEOUT_MS = 10_000
const decodeWorkspace = Schema.decodeUnknownEffect(
	Schema.Struct({
		data: Schema.Struct({
			viewer: Schema.Struct({
				organization: Schema.Struct({ name: Schema.String }),
			}),
		}),
	})
)
const decodeErrors = Schema.decodeUnknownOption(
	Schema.Struct({
		errors: Schema.Array(
			Schema.Struct({
				extensions: Schema.optional(
					Schema.Struct({ code: Schema.optional(Schema.String) })
				),
			})
		),
	})
)

/** Linear answers a revoked or expired token with 401, or with a GraphQL `AUTHENTICATION_ERROR`. */
function isRefused(status: number, json: unknown) {
	return (
		status === 401 ||
		Option.match(decodeErrors(json), {
			onNone: () => false,
			onSome: ({ errors }) =>
				errors.some(
					({ extensions }) => extensions?.code === 'AUTHENTICATION_ERROR'
				),
		})
	)
}

export const HttpLinearApiLive = Layer.succeed(
	LinearApi,
	LinearApi.of({
		readWorkspaceName: Effect.fn('LinearApi.readWorkspaceName')(
			function* (accessToken: string) {
				const response = yield* Effect.tryPromise({
					try: async signal =>
						await fetch(LINEAR_GRAPHQL_URL, {
							method: 'POST',
							headers: {
								'Content-Type': 'application/json',
								Authorization: `Bearer ${accessToken}`,
							},
							body: JSON.stringify({
								query: '{ viewer { organization { name } } }',
							}),
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

				if (isRefused(response.status, json))
					return yield* new LinearConnectionLapsed()
				if (!response.ok) return yield* Effect.fail(String(response.status))

				const { data } = yield* decodeWorkspace(json).pipe(
					Effect.mapError(() => 'UnexpectedResponse')
				)

				return data.viewer.organization.name
			},
			Effect.tapError(reason =>
				typeof reason === 'string'
					? Effect.logWarning('Linear read failed', reason)
					: Effect.void
			),
			Effect.mapError(reason =>
				typeof reason === 'string' ? new LinearReadFailed() : reason
			)
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
