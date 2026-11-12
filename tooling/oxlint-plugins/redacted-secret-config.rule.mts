import { defineRule, type ESTree } from '@oxlint/plugins'

const SECRET_NAME_PATTERN = /SECRET|PASSWORD|TOKEN|KEY|^DATABASE_URL/u
const REDACTED_SCHEMAS = new Set(['Redacted', 'RedactedFromValue'])

/** Config members whose first argument is a value or a prefix, not a variable name. */
const NAMELESS_MEMBERS = new Set(['nested', 'succeed', 'withDefault'])

/** Config readers that take the variable name after codecs or literals, with the name's argument index. */
const NAME_INDEX_BY_READER = new Map([
	['Array', 1],
	['Literal', 1],
	['Literals', 1],
	['Record', 2],
	['schema', 1],
])

/** Secret-looking names that are public on purpose, with the reason. */
const PUBLIC_NAMES = new Map([
	[
		'POSTHOG_KEY',
		"PostHog's public project key, the same value the browser bundle ships",
	],
])

function getConfigMember({ callee }: ESTree.CallExpression) {
	if (
		callee.type !== 'MemberExpression' ||
		callee.computed ||
		callee.object.type !== 'Identifier' ||
		callee.object.name !== 'Config' ||
		callee.property.type !== 'Identifier'
	)
		return
	return callee.property.name
}

function getLiteralString(node: ESTree.Node | undefined) {
	if (node?.type === 'Literal' && typeof node.value === 'string')
		return node.value
	if (node?.type === 'TemplateLiteral' && node.expressions.length === 0)
		return node.quasis[0]?.value.cooked ?? undefined
}

function isRedactedSchema(node: ESTree.Node | undefined) {
	return (
		node?.type === 'CallExpression' &&
		node.callee.type === 'MemberExpression' &&
		node.callee.object.type === 'Identifier' &&
		node.callee.object.name === 'Schema' &&
		node.callee.property.type === 'Identifier' &&
		REDACTED_SCHEMAS.has(node.callee.property.name)
	)
}

/**
 * Requires secrets read through Effect `Config` to stay `Redacted`: a
 * variable whose name contains SECRET, PASSWORD, TOKEN or KEY, or starts with
 * DATABASE_URL, must be read with `Config.Redacted` (or
 * `Config.schema(Schema.Redacted(...), name)`), so it prints as `<redacted>`
 * in logs and errors until the one place that builds the client unwraps it.
 * Only literal names are judged; `PUBLIC_NAMES` lists the deliberate exceptions.
 */
export const redactedSecretConfigRule = defineRule({
	meta: {
		type: 'problem',
		docs: {
			description:
				'Secrets read from Config stay Redacted until the client that needs them is built.',
		},
		messages: {
			plainSecret:
				'{{ name }} is a secret; read it with Config.Redacted and unwrap it with Redacted.value only where the client is built (AGENTS.md).',
		},
	},
	create(context) {
		return {
			CallExpression(node) {
				const member = getConfigMember(node)
				if (!member || member === 'Redacted' || NAMELESS_MEMBERS.has(member))
					return

				const name = getLiteralString(
					node.arguments[NAME_INDEX_BY_READER.get(member) ?? 0]
				)
				if (
					!name ||
					!SECRET_NAME_PATTERN.test(name) ||
					PUBLIC_NAMES.has(name) ||
					(member === 'schema' && isRedactedSchema(node.arguments[0]))
				)
					return

				context.report({ node, messageId: 'plainSecret', data: { name } })
			},
		}
	},
})
