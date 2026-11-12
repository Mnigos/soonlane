import { defineRule, type ESTree } from '@oxlint/plugins'

const BRANDS = new Set(['CalendarDate', 'LabelId', 'TaskId', 'UserId'])

function getTypeName({ typeName }: ESTree.TSTypeReference) {
	if (typeName.type === 'Identifier') return typeName.name
	if (typeName.type === 'TSQualifiedName') return typeName.right.name
}

/** The brand a type names, also inside a union, intersection, array, type argument, `readonly` or parentheses (`TaskId | undefined`, `Array<TaskId>`). */
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
 * Forbids type assertions (`value as` or `<TaskId>value`) to the id and
 * calendar date brands, also inside a Zod `.transform()`. Contract schemas
 * brand with Zod's `.brand()` and Drizzle brands rows, so code receives
 * branded values; the one cast is the private `fromUtcDate` in
 * `packages/domain/src/dates/calendar-date.helper.ts`, the file
 * `oxlint.conventions.mts` exempts.
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
