import { defineRule, type ESTree } from '@oxlint/plugins'

const BRANDS = new Set(['CalendarDate', 'LabelId', 'TaskId', 'UserId'])

function getTypeName({ typeName }: ESTree.TSTypeReference) {
	if (typeName.type === 'Identifier') return typeName.name
	if (typeName.type === 'TSQualifiedName') return typeName.right.name
}

/** The brand a type names, also inside a union, intersection, array, type argument, `readonly` or parentheses (`as TaskId | undefined`, `as Array<TaskId>`). */
function findBrand(type: ESTree.TSType): string | undefined {
	switch (type.type) {
		case 'TSTypeReference': {
			const name = getTypeName(type)

			if (name !== undefined && BRANDS.has(name)) return name

			return type.typeArguments?.params.map(findBrand).find(Boolean)
		}
		case 'TSUnionType':
		case 'TSIntersectionType':
			return type.types.map(findBrand).find(Boolean)
		case 'TSArrayType':
			return findBrand(type.elementType)
		case 'TSTypeOperator':
		case 'TSParenthesizedType':
			return findBrand(type.typeAnnotation)
		default:
			return undefined
	}
}

/**
 * Forbids type assertions (`as TaskId`, `<TaskId>value`) to the id and
 * calendar date brands. Contract schemas brand ids and calendar dates at the
 * API boundary and Drizzle brands rows, so app code receives branded values;
 * only `packages/contracts/src/*.schemas.ts` and `packages/domain` cast, and
 * `oxlint.conventions.mts` turns the rule off there.
 */
export const noBrandCastRule = defineRule({
	meta: {
		type: 'problem',
		docs: {
			description:
				'Branded ids and calendar dates come from the contract schemas, not from casts in app code.',
		},
		messages: {
			brandCast:
				'Do not cast to {{ name }}; parse the value with its contract schema or take it from the Drizzle row (AGENTS.md).',
		},
	},
	create(context) {
		function check(node: ESTree.TSAsExpression | ESTree.TSTypeAssertion) {
			const name = findBrand(node.typeAnnotation)

			if (name) context.report({ node, messageId: 'brandCast', data: { name } })
		}

		return { TSAsExpression: check, TSTypeAssertion: check }
	},
})
