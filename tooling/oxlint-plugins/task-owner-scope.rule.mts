import { defineRule, type ESTree } from '@oxlint/plugins'

const DB_PACKAGE = '@soonlane/db'
const TABLE = 'task'
const OWNER_COLUMN = 'ownerId'
/** Drizzle builder methods whose first argument is the table the statement reads, changes or joins. */
const QUERY_METHODS = new Set([
	'$count',
	'crossJoin',
	'delete',
	'from',
	'fullJoin',
	'innerJoin',
	'leftJoin',
	'rightJoin',
	'update',
])

function getPropertyName(node: ESTree.MemberExpression) {
	if (!node.computed && node.property.type === 'Identifier')
		return node.property.name
	if (
		node.property.type === 'Literal' &&
		typeof node.property.value === 'string'
	)
		return node.property.value
}

function getKeyName(property: ESTree.ObjectPattern['properties'][number]) {
	if (property.type !== 'Property') return
	if (!property.computed && property.key.type === 'Identifier')
		return property.key.name
	if (property.key.type === 'Literal' && typeof property.key.value === 'string')
		return property.key.value
}

/**
 * Keeps every query on the task table to its owner. `task.ownerId` may appear only where `ownedTasks` and `ownedBy`
 * are defined (`owned-tasks.query.ts`, where the rule is off), so the owner condition is written once. A statement on
 * the table (`from`, `update`, `delete`, a join or `$count` with `task`, or `task` inside a tagged template such as raw
 * `sql`) is an error everywhere else, because it could leave the condition out; the few single statements that take
 * `ownedBy` instead run with `allowTableQueries`. Inserts stay allowed: the owner is a required column there, not a
 * filter. The table is recognised by its import from `@soonlane/db` (named, renamed or through a namespace import) and
 * by local aliases of it (`const t = task`, `const { task } = schema`).
 */
export const taskOwnerScopeRule = defineRule({
	meta: {
		type: 'problem',
		docs: {
			description:
				'Task queries go through ownedTasks or ownedBy, so none can leave out the owner filter.',
		},
		schema: [
			{
				type: 'object',
				properties: { allowTableQueries: { type: 'boolean' } },
				additionalProperties: false,
			},
		],
		messages: {
			ownerColumn:
				'Take the owner condition from ownedBy or ownedTasks in owned-tasks.query.ts; task.ownerId is read only there (CLAUDE.md).',
			tableQuery:
				'Query the task table through ownedTasks(database, ownerId) so the owner filter cannot be left out (CLAUDE.md).',
		},
	},
	create(context) {
		const [options] = context.options
		const allowTableQueries =
			typeof options === 'object' &&
			options !== null &&
			!Array.isArray(options) &&
			options.allowTableQueries === true
		const tableNames = new Set<string>()
		const namespaces = new Set<string>()

		function isTable(node: ESTree.Node | null | undefined) {
			if (!node) return false
			if (node.type === 'Identifier') return tableNames.has(node.name)
			if (node.type === 'TSNonNullExpression' || node.type === 'TSAsExpression')
				return isTable(node.expression)

			return (
				node.type === 'MemberExpression' &&
				node.object.type === 'Identifier' &&
				namespaces.has(node.object.name) &&
				getPropertyName(node) === TABLE
			)
		}

		return {
			ImportDeclaration(node) {
				if (node.source.value !== DB_PACKAGE) return

				for (const specifier of node.specifiers) {
					if (specifier.type === 'ImportNamespaceSpecifier')
						namespaces.add(specifier.local.name)
					if (
						specifier.type === 'ImportSpecifier' &&
						specifier.imported.type === 'Identifier' &&
						specifier.imported.name === TABLE
					)
						tableNames.add(specifier.local.name)
				}
			},
			MemberExpression(node) {
				if (isTable(node.object) && getPropertyName(node) === OWNER_COLUMN)
					context.report({ node, messageId: 'ownerColumn' })
			},
			VariableDeclarator(node) {
				if (node.id.type === 'Identifier' && isTable(node.init))
					tableNames.add(node.id.name)
				if (node.id.type !== 'ObjectPattern') return

				const isNamespace =
					node.init?.type === 'Identifier' && namespaces.has(node.init.name)
				const isTableInit = isTable(node.init)

				for (const property of node.id.properties) {
					const key = getKeyName(property)

					if (isTableInit && key === OWNER_COLUMN)
						context.report({ node: property, messageId: 'ownerColumn' })
					if (
						isNamespace &&
						key === TABLE &&
						property.type === 'Property' &&
						property.value.type === 'Identifier'
					)
						tableNames.add(property.value.name)
				}
			},
			TaggedTemplateExpression(node) {
				if (
					!allowTableQueries &&
					node.quasi.expressions.some(expression => isTable(expression))
				)
					context.report({ node, messageId: 'tableQuery' })
			},
			CallExpression(node) {
				if (allowTableQueries || node.callee.type !== 'MemberExpression') return

				const method = getPropertyName(node.callee)

				if (method && QUERY_METHODS.has(method) && isTable(node.arguments[0]))
					context.report({ node, messageId: 'tableQuery' })
			},
		}
	},
})
