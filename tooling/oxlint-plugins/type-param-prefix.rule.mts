import { defineRule, type ESTree } from '@oxlint/plugins'

const TYPE_PARAM_PATTERN = /^T(?:[A-Z]\w*)?$/

/**
 * Requires type parameter names, including `infer` bindings and mapped type
 * keys, to be `T` or `T` followed by a PascalCase name such as
 * `TOperationResult`.
 */
export const typeParamPrefixRule = defineRule({
	meta: {
		type: 'suggestion',
		docs: {
			description:
				'Type parameters are named T or T followed by a PascalCase name.',
		},
		messages: {
			missingTypeParamPrefix:
				'Rename type parameter {{ name }} to T or a T-prefixed PascalCase name such as TResult (AGENTS.md).',
		},
	},
	create(context) {
		function checkName(identifier: ESTree.BindingIdentifier) {
			if (TYPE_PARAM_PATTERN.test(identifier.name)) return
			context.report({
				node: identifier,
				messageId: 'missingTypeParamPrefix',
				data: { name: identifier.name },
			})
		}

		return {
			TSTypeParameter: node => checkName(node.name),
			TSMappedType: node => checkName(node.key),
		}
	},
})
