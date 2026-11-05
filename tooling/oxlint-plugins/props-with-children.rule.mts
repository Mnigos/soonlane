import { defineRule, type ESTree } from '@oxlint/plugins'

function isReactNode(typeName: ESTree.TSTypeName) {
	if (typeName.type === 'TSQualifiedName')
		return (
			typeName.left.type === 'Identifier' &&
			typeName.left.name === 'React' &&
			typeName.right.name === 'ReactNode'
		)

	return typeName.type === 'Identifier' && typeName.name === 'ReactNode'
}

/**
 * Requires props to declare `children` by extending `PropsWithChildren` from
 * `react` instead of a `children: ReactNode` property signature in an
 * interface or type literal.
 */
export const propsWithChildrenRule = defineRule({
	meta: {
		type: 'suggestion',
		docs: {
			description:
				'Props declare children by extending PropsWithChildren, not with children: ReactNode.',
		},
		messages: {
			childrenReactNode:
				"Extend PropsWithChildren (import type { PropsWithChildren } from 'react') instead of declaring children: ReactNode (AGENTS.md).",
		},
	},
	create(context) {
		return {
			TSPropertySignature(node) {
				const type = node.typeAnnotation?.typeAnnotation
				if (
					node.computed ||
					node.key.type !== 'Identifier' ||
					node.key.name !== 'children' ||
					type?.type !== 'TSTypeReference' ||
					!isReactNode(type.typeName)
				)
					return

				context.report({ node, messageId: 'childrenReactNode' })
			},
		}
	},
})
