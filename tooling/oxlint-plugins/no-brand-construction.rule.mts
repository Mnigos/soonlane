import { defineRule } from '@oxlint/plugins'

const BRAND_CONSTRUCTORS = new Set([
	'toCalendarDate',
	'toLabelId',
	'toTaskId',
	'toUserId',
])

/**
 * Forbids importing the `to*` brand constructors (or the whole namespace)
 * from `@soonlane/domain`.
 * Contract schemas brand ids and calendar dates at the API boundary, and
 * Drizzle brands rows, so app code receives branded values; the few files
 * that genuinely build one (date arithmetic, Better Auth, the changelog
 * parser) turn this rule off in `oxlint.conventions.mts`.
 */
export const noBrandConstructionRule = defineRule({
	meta: {
		type: 'problem',
		docs: {
			description:
				'Branded ids and calendar dates come from the contract schemas, not from casts in app code.',
		},
		messages: {
			brandConstruction:
				'{{ name }} is for construction boundaries only; take the branded value from the contract schema or the Drizzle row instead (AGENTS.md).',
		},
	},
	create(context) {
		return {
			ImportDeclaration(node) {
				if (node.source.value !== '@soonlane/domain') return

				for (const specifier of node.specifiers) {
					if (specifier.type === 'ImportNamespaceSpecifier')
						context.report({
							node: specifier,
							messageId: 'brandConstruction',
							data: { name: 'A namespace import' },
						})
					if (
						specifier.type === 'ImportSpecifier' &&
						specifier.imported.type === 'Identifier' &&
						BRAND_CONSTRUCTORS.has(specifier.imported.name)
					)
						context.report({
							node: specifier,
							messageId: 'brandConstruction',
							data: { name: specifier.imported.name },
						})
				}
			},
		}
	},
})
