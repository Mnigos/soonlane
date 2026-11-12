import { defineRule, type ESTree, type Fixer } from '@oxlint/plugins'

type ProgramStatement = ESTree.Program['body'][number]

/**
 * Tells whether a module-level statement is a `const` declaration, exported or
 * not, written on a single line, whose every binding is a plain identifier of
 * any case: the declarations this rule keeps together.
 */
export function isSingleLineConst(statement: ProgramStatement) {
	const declaration =
		statement.type === 'ExportNamedDeclaration'
			? statement.declaration
			: statement

	return (
		declaration?.type === 'VariableDeclaration' &&
		declaration.kind === 'const' &&
		statement.loc.start.line === statement.loc.end.line &&
		declaration.declarations.every(({ id }) => id.type === 'Identifier')
	)
}

/**
 * Keeps consecutive single-line module-level `const` declarations together: a
 * blank line between two of them (exported or not, any binding case) is
 * removed. Destructuring never joins a group, a multi-line statement on either
 * side ends the group, an own-line comment in the gap is a deliberate
 * separator, and `let`, `var`, types and nested scopes are not checked.
 */
export const declarationGroupSpacingRule = defineRule({
	meta: {
		type: 'layout',
		docs: {
			description:
				'Consecutive single-line module-level const declarations stay together without blank lines.',
		},
		fixable: 'whitespace',
		messages: {
			blankLineInDeclarationGroup:
				'Consecutive single-line module-level const declarations stay together; remove the blank line (AGENTS.md).',
		},
	},
	create(context) {
		const { sourceCode } = context

		function getGap(
			previous: ProgramStatement,
			next: ProgramStatement
		): ESTree.Span[] {
			return [
				previous,
				...sourceCode.getTokensBetween(previous, next, {
					includeComments: true,
				}),
				next,
			]
		}

		function getBlankRuns(gap: ESTree.Span[]) {
			return gap.flatMap((item, index) => {
				const previous = gap[index - 1]

				return previous && item.loc.start.line - previous.loc.end.line > 1
					? [{ previous, item }]
					: []
			})
		}

		function hasOwnLineComment(previous: ProgramStatement, gap: ESTree.Span[]) {
			return gap.some(
				item =>
					'type' in item &&
					(item.type === 'Line' || item.type === 'Block') &&
					item.loc.start.line > previous.loc.end.line
			)
		}

		function checkPair(previous: ProgramStatement, next: ProgramStatement) {
			if (!(isSingleLineConst(previous) && isSingleLineConst(next))) return

			const gap = getGap(previous, next)
			const blankRuns = getBlankRuns(gap)

			if (blankRuns.length === 0 || hasOwnLineComment(previous, gap)) return

			context.report({
				node: next,
				messageId: 'blankLineInDeclarationGroup',
				fix: (fixer: Fixer) =>
					blankRuns.map(({ previous: { end }, item }) => {
						const whitespace = sourceCode.text.slice(end, item.start)
						const newline = /\r\n?|\n/.exec(whitespace)?.[0] ?? '\n'
						const indentation = whitespace.slice(
							whitespace.lastIndexOf('\n') + 1
						)

						return fixer.replaceTextRange(
							[end, item.start],
							`${newline}${indentation}`
						)
					}),
			})
		}

		return {
			Program(node) {
				for (const [index, statement] of node.body.entries()) {
					const previous = node.body[index - 1]

					if (previous) checkPair(previous, statement)
				}
			},
		}
	},
})
