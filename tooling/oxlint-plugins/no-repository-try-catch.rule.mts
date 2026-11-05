import { defineRule, type ESTree } from '@oxlint/plugins'

const EFFECT_ERROR_HANDLER_PATTERN =
	/^(?:catch|orElse|orDie|ignore|match|mapError|try|either|exit|result|sandbox)/u

function isEffectMember(node: ESTree.MemberExpression) {
	return (
		node.object.type === 'Identifier' &&
		node.object.name === 'Effect' &&
		!node.computed &&
		node.property.type === 'Identifier'
	)
}

function getRejectionHandler({
	callee,
	arguments: args,
}: ESTree.CallExpression) {
	if (
		callee.type !== 'MemberExpression' ||
		callee.computed ||
		callee.property.type !== 'Identifier' ||
		isEffectMember(callee)
	)
		return
	if (callee.property.name === 'catch') return args[0]
	if (callee.property.name === 'then') return args[1]
}

/**
 * Forbids catching errors in repositories: no `try`/`catch`, no promise
 * `.catch()`/`.then()` rejection handlers and no Effect combinators that
 * catch, recover, ignore or translate failures (`Effect.catch*`,
 * `Effect.orElse*`, `Effect.mapError`, `Effect.tryPromise`, ...). Queries go
 * through `Db.run`, which owns the single `DbError` translation; services and
 * handlers decide what a failure means. Cleanup-only `try`/`finally` stays
 * allowed.
 */
export const noRepositoryTryCatchRule = defineRule({
	meta: {
		type: 'suggestion',
		docs: {
			description:
				'Repositories must not catch or transform errors; Db.run translates database failures and services own error handling.',
		},
		messages: {
			repositoryTryCatch:
				'Repositories should not catch or transform errors; let the calling service or handler catch and translate them (AGENTS.md).',
			repositoryEffectCatch:
				'Repositories run queries through Db.run and must not catch, recover or translate Effect failures with Effect.{{name}}; let the service decide (AGENTS.md).',
		},
	},
	create(context) {
		return {
			TryStatement(node) {
				if (node.handler)
					context.report({ node, messageId: 'repositoryTryCatch' })
			},
			CallExpression(node) {
				if (getRejectionHandler(node))
					context.report({ node, messageId: 'repositoryTryCatch' })
			},
			MemberExpression(node) {
				if (
					!isEffectMember(node) ||
					node.property.type !== 'Identifier' ||
					!EFFECT_ERROR_HANDLER_PATTERN.test(node.property.name)
				)
					return

				context.report({
					node,
					messageId: 'repositoryEffectCatch',
					data: { name: node.property.name },
				})
			},
		}
	},
})
