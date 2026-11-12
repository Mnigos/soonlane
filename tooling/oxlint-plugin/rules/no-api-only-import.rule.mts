import { defineRule, type ESTree } from '@oxlint/plugins'

const API_ONLY_SPECIFIERS = [
	'@soonlane/auth/server',
	'@soonlane/db',
	'pg',
	'drizzle-orm',
]

function isApiOnly(source: string) {
	return API_ONLY_SPECIFIERS.some(
		specifier => source === specifier || source.startsWith(`${specifier}/`)
	)
}

/**
 * Forbids importing Better Auth's server, the database package and its drivers
 * (`@soonlane/auth/server`, `@soonlane/db`, `pg`, `drizzle-orm` and their
 * subpaths). Only `apps/api` talks to the database; the web app reaches it
 * through the API. Covers static imports, re-exports and `import()`.
 */
export const noApiOnlyImportRule = defineRule({
	meta: {
		type: 'problem',
		docs: {
			description:
				'The web app reaches the database and Better Auth only through the API.',
		},
		messages: {
			apiOnlyImport:
				'{{ source }} runs only in apps/api; call the API instead (AGENTS.md).',
		},
	},
	create(context) {
		function check(source: ESTree.Node | null | undefined) {
			if (
				source?.type !== 'Literal' ||
				typeof source.value !== 'string' ||
				!isApiOnly(source.value)
			)
				return

			context.report({
				node: source,
				messageId: 'apiOnlyImport',
				data: { source: source.value },
			})
		}

		return {
			ImportDeclaration: node => check(node.source),
			ExportNamedDeclaration: node => check(node.source),
			ExportAllDeclaration: node => check(node.source),
			ImportExpression: node => check(node.source),
		}
	},
})
