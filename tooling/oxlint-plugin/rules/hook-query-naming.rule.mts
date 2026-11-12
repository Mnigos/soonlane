import { defineRule, type ESTree } from '@oxlint/plugins'

const QUERY_SUFFIX_PATTERN = /^use\w+(?:Query|Queries)$/
const HOOK_NAME_PATTERN = /^use[A-Z]\w*$/
const QUERY_HOOK_CALL_PATTERN = /^(?:useQuery|useInfiniteQuery|useQueries)$/
const QUERY_CALL_PATTERN =
	/^(?:useQuery|useInfiniteQuery|useQueries|infiniteQueryOptions|(?:[\s\S]*\.)?(?:queryOptions|infiniteOptions))$/

type HookFunction = ESTree.ArrowFunctionExpression | ESTree.Function

interface HookFrame {
	node: HookFunction
	hookId?: ESTree.BindingIdentifier
	hasQueryCall: boolean
}

function unwrapExpression(expression: ESTree.Expression): ESTree.Expression {
	if (
		expression.type === 'ParenthesizedExpression' ||
		expression.type === 'TSAsExpression' ||
		expression.type === 'TSSatisfiesExpression' ||
		expression.type === 'TSNonNullExpression' ||
		expression.type === 'TSTypeAssertion'
	)
		return unwrapExpression(expression.expression)
	return expression
}

function getHookId(node: HookFunction) {
	if (node.type === 'FunctionDeclaration') return node.id ?? undefined
	if (
		node.type !== 'ArrowFunctionExpression' &&
		node.type !== 'FunctionExpression'
	)
		return
	const { parent } = node
	if (parent?.type === 'VariableDeclarator' && parent.id.type === 'Identifier')
		return parent.id
}

function isConstructionStatement(statement: ESTree.Statement) {
	return (
		(statement.type === 'ReturnStatement' && statement.argument !== null) ||
		(statement.type === 'VariableDeclaration' && statement.kind === 'const')
	)
}

/**
 * Enforces the `Query`/`Queries` hook suffix: a hook takes it only when its
 * body just builds and returns TanStack Query object(s) unchanged.
 */
export const hookQueryNamingRule = defineRule({
	meta: {
		type: 'suggestion',
		docs: {
			description:
				'Hooks take the Query suffix only when they just build and return TanStack Query objects.',
		},
		messages: {
			missingQueryCall: 'Hooks named *Query must only wrap TanStack Query.',
			derivedQueryResult:
				'Hooks named *Query must return the TanStack Query result unchanged.',
			missingQuerySuffix: 'Pure query hooks take the Query suffix.',
		},
	},
	create(context) {
		const frames: HookFrame[] = []

		function getCalleeText(call: ESTree.CallExpression) {
			return context.sourceCode.getText(call.callee)
		}

		function isQueryHookCall(expression: ESTree.Expression) {
			const unwrapped = unwrapExpression(expression)
			return (
				unwrapped.type === 'CallExpression' &&
				QUERY_HOOK_CALL_PATTERN.test(getCalleeText(unwrapped))
			)
		}

		function isQueryResultBinding(
			identifier: ESTree.IdentifierReference,
			hook: HookFunction
		) {
			let scope: ReturnType<typeof context.sourceCode.getScope> | null =
				context.sourceCode.getScope(identifier)
			while (scope) {
				const variable = scope.set.get(identifier.name)
				if (variable) {
					const [definition] = variable.defs
					return (
						variable.defs.length === 1 &&
						variable.scope.block === hook &&
						definition?.type === 'Variable' &&
						definition.parent?.type === 'VariableDeclaration' &&
						definition.parent.kind === 'const' &&
						definition.node.type === 'VariableDeclarator' &&
						definition.node.id.type === 'Identifier' &&
						definition.node.init !== null &&
						isQueryHookCall(definition.node.init)
					)
				}
				scope = scope.upper
			}
			return false
		}

		function isQueryResult(
			expression: ESTree.Expression,
			hook: HookFunction
		): boolean {
			const unwrapped = unwrapExpression(expression)
			if (unwrapped.type === 'CallExpression') return isQueryHookCall(unwrapped)
			if (unwrapped.type === 'Identifier')
				return isQueryResultBinding(unwrapped, hook)
			if (unwrapped.type === 'ArrayExpression')
				return (
					unwrapped.elements.length > 0 &&
					unwrapped.elements.every(
						element =>
							element !== null &&
							element.type !== 'SpreadElement' &&
							isQueryResult(element, hook)
					)
				)
			if (unwrapped.type === 'ObjectExpression')
				return (
					unwrapped.properties.length > 0 &&
					unwrapped.properties.every(
						property =>
							property.type === 'Property' &&
							isQueryResult(property.value as ESTree.Expression, hook)
					)
				)
			return false
		}

		function isPureQueryHook(hook: HookFunction) {
			const { body } = hook
			if (!body) return false
			if (body.type !== 'BlockStatement') return isQueryResult(body, hook)
			const statements = body.body
			const returns = statements.filter(
				statement => statement.type === 'ReturnStatement'
			)
			return (
				returns.length > 0 &&
				statements.every(isConstructionStatement) &&
				returns.every(
					statement =>
						statement.argument !== null &&
						isQueryResult(statement.argument, hook)
				)
			)
		}

		function enterFunction(node: HookFunction) {
			frames.push({ node, hookId: getHookId(node), hasQueryCall: false })
		}

		function exitFunction() {
			const frame = frames.pop()
			const hookId = frame?.hookId
			if (!(frame && hookId)) return

			if (QUERY_SUFFIX_PATTERN.test(hookId.name)) {
				if (!frame.hasQueryCall)
					context.report({ node: hookId, messageId: 'missingQueryCall' })
				else if (!isPureQueryHook(frame.node))
					context.report({ node: hookId, messageId: 'derivedQueryResult' })
				return
			}

			if (HOOK_NAME_PATTERN.test(hookId.name) && isPureQueryHook(frame.node))
				context.report({ node: hookId, messageId: 'missingQuerySuffix' })
		}

		return {
			FunctionDeclaration: enterFunction,
			FunctionExpression: enterFunction,
			ArrowFunctionExpression: enterFunction,
			'FunctionDeclaration:exit': exitFunction,
			'FunctionExpression:exit': exitFunction,
			'ArrowFunctionExpression:exit': exitFunction,
			CallExpression(node) {
				if (!QUERY_CALL_PATTERN.test(getCalleeText(node))) return
				for (const frame of frames) frame.hasQueryCall = true
			},
		}
	},
})
