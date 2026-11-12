import { defineRule, type ESTree, type Fixer } from '@oxlint/plugins'

type ProgramStatement = ESTree.Program['body'][number]

const DECLARATION_TYPES = new Set([
	'ClassDeclaration',
	'FunctionDeclaration',
	'TSDeclareFunction',
	'TSEnumDeclaration',
	'TSInterfaceDeclaration',
	'TSModuleDeclaration',
	'TSTypeAliasDeclaration',
	'VariableDeclaration',
])

/**
 * Line comments that talk to a tool, not to the reader: lint and type-checker
 * suppressions, formatter switches, editor regions, and `///` directives.
 */
const DIRECTIVE_PATTERN =
	/^\s*(?:\/|oxlint-|eslint-|@ts-|biome-ignore|prettier-ignore|#(?:end)?region\b)/u

function isDeclaration(statement: ProgramStatement) {
	const declaration =
		statement.type === 'ExportNamedDeclaration' ||
		statement.type === 'ExportDefaultDeclaration'
			? statement.declaration
			: statement

	return declaration !== null && DECLARATION_TYPES.has(declaration.type)
}

function isDocLine(comment: ESTree.Comment) {
	return comment.type === 'Line' && !DIRECTIVE_PATTERN.test(comment.value)
}

/**
 * The run of own-line `//` comments that ends on the line right above the
 * statement, top to bottom, or an empty list when a blank line, a directive,
 * a block comment or code sits in between.
 */
function getDocRun(comments: ESTree.Comment[], statementLine: number) {
	const run: ESTree.Comment[] = []

	for (const comment of comments.toReversed()) {
		const expectedLine = (run[0]?.loc.start.line ?? statementLine) - 1

		if (comment.loc.end.line !== expectedLine || !isDocLine(comment)) break
		run.unshift(comment)
	}

	return run
}

function toJsdoc(lines: string[]) {
	if (lines.length === 1) return `/** ${lines[0]} */`

	const body = lines.map(line => (line ? ` * ${line}` : ' *')).join('\n')

	return `/**\n${body}\n */`
}

/**
 * Requires JSDoc instead of `//` for a comment that ends on the line directly
 * above a module-level declaration (function, class, variable, type,
 * interface, enum, namespace, alone or wrapped in `export` /
 * `export default`), so the text shows up in editor hovers at every use. A
 * run of consecutive `//` lines becomes one block. Tool directives, comments
 * separated by a blank line, trailing comments, default-exported expressions
 * and anything inside nested scopes are left alone.
 */
export const declarationJsdocRule = defineRule({
	meta: {
		type: 'suggestion',
		docs: {
			description:
				'A comment directly above a module-level declaration is JSDoc, not //.',
		},
		fixable: 'code',
		messages: {
			lineCommentAboveDeclaration:
				'Write the comment above a module-level declaration as JSDoc (/** … */) so it shows in hovers (AGENTS.md).',
		},
	},
	create(context) {
		const { sourceCode } = context

		function isOwnLine(comment: ESTree.Comment) {
			const lineStart = sourceCode.text.lastIndexOf('\n', comment.start - 1) + 1

			return sourceCode.text.slice(lineStart, comment.start).trim() === ''
		}

		function checkStatement(statement: ProgramStatement) {
			if (!isDeclaration(statement)) return

			const run = getDocRun(
				sourceCode.getCommentsBefore(statement),
				statement.loc.start.line
			).filter(isOwnLine)
			const [first] = run
			const last = run.at(-1)

			if (!(first && last)) return

			const lines = run.map(({ value }) => value.replace(/^ /u, '').trimEnd())

			context.report({
				loc: { start: first.loc.start, end: last.loc.end },
				messageId: 'lineCommentAboveDeclaration',
				fix: lines.some(line => line.includes('*/'))
					? undefined
					: (fixer: Fixer) =>
							fixer.replaceTextRange([first.start, last.end], toJsdoc(lines)),
			})
		}

		return {
			Program(node) {
				for (const statement of node.body) checkStatement(statement)
			},
		}
	},
})
