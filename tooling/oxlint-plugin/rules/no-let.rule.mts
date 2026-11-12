import { defineRule, type ESTree } from '@oxlint/plugins'

const FUNCTION_TYPES = new Set([
	'FunctionDeclaration',
	'FunctionExpression',
	'ArrowFunctionExpression',
])

function isLoopHead(declaration: ESTree.VariableDeclaration) {
	const { parent } = declaration

	return (
		(parent.type === 'ForStatement' && parent.init === declaration) ||
		((parent.type === 'ForInStatement' || parent.type === 'ForOfStatement') &&
			parent.left === declaration)
	)
}

function isInsideFunction(declaration: ESTree.VariableDeclaration) {
	for (
		let node: ESTree.Node | null = declaration.parent;
		node;
		node = node.parent
	)
		if (FUNCTION_TYPES.has(node.type)) return true

	return false
}

/**
 * Forbids `let` inside functions, including a declaration whose single
 * assignment sits in another block, which `prefer-const` misses. Module-level
 * `let` (lazily initialised module state) and loop heads stay allowed. Not
 * auto-fixable: the fix means restructuring the code.
 */
export const noLetRule = defineRule({
	meta: {
		type: 'suggestion',
		docs: {
			description: 'Functions declare variables with const, not let.',
		},
		messages: {
			letInFunction:
				'Use const: move the use into the block that assigns the value, return early, or extract a function (AGENTS.md).',
		},
	},
	create(context) {
		return {
			VariableDeclaration(node) {
				if (node.kind !== 'let' || isLoopHead(node) || !isInsideFunction(node))
					return

				context.report({ node, messageId: 'letInFunction' })
			},
		}
	},
})
