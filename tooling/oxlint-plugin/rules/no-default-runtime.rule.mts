import { defineRule, type ESTree } from '@oxlint/plugins'

const DEFAULT_RUNTIME_RUNNERS = new Set([
	'runCallback',
	'runFork',
	'runPromise',
	'runPromiseExit',
	'runSync',
	'runSyncExit',
])

function getEffectMember(node: ESTree.MemberExpression) {
	if (
		node.computed ||
		node.object.type !== 'Identifier' ||
		node.object.name !== 'Effect' ||
		node.property.type !== 'Identifier'
	)
		return
	return node.property.name
}

/**
 * Forbids running an effect on Effect's default runtime (`Effect.runSync`,
 * `Effect.runPromise`, `Effect.runFork`, their `Exit` variants and
 * `Effect.runCallback`), including named imports of them from `effect/Effect`.
 * The default runtime starts from an empty context, so nothing `AppLive`
 * provides (a logger, a tracer) reaches the effect. Run it with
 * `Effect.run*With(context)` inside a layer or `runtime.run*` at a framework
 * edge; the process entry points turn this rule off in `oxlint.conventions.mts`.
 */
export const noDefaultRuntimeRule = defineRule({
	meta: {
		type: 'problem',
		docs: {
			description:
				"Effects run through the app runtime, not Effect's default one.",
		},
		messages: {
			defaultRuntime:
				'Effect.{{ name }} runs on the default runtime and skips what AppLive provides; use Effect.{{ name }}With(context) inside a layer or runtime.{{ name }} at a framework edge (AGENTS.md).',
		},
	},
	create(context) {
		return {
			MemberExpression(node) {
				const name = getEffectMember(node)

				if (name && DEFAULT_RUNTIME_RUNNERS.has(name))
					context.report({ node, messageId: 'defaultRuntime', data: { name } })
			},
			ImportDeclaration(node) {
				if (node.source.value !== 'effect/Effect') return

				for (const specifier of node.specifiers)
					if (
						specifier.type === 'ImportSpecifier' &&
						specifier.imported.type === 'Identifier' &&
						DEFAULT_RUNTIME_RUNNERS.has(specifier.imported.name)
					)
						context.report({
							node: specifier,
							messageId: 'defaultRuntime',
							data: { name: specifier.imported.name },
						})
			},
		}
	},
})
