import { defineRule, type ESTree, type Fixer } from '@oxlint/plugins'
import { isSingleLineConstant } from './declaration-group-spacing.rule.mts'
import {
	getInferredAliases,
	type ProgramStatement,
} from './inferred-type-placement.helper.mts'

type BlockEdge = ESTree.Comment | ProgramStatement
type Neighbour = ESTree.Comment | ESTree.Token

interface MovedBlock {
	index: number
	sourceIndex: number
	first: BlockEdge
	last: BlockEdge
	previous?: Neighbour
	next?: Neighbour
}

interface TextEdit {
	start: number
	end: number
	text: string
}

const ASI_SAFE_TOKEN_TYPES = new Set(['Identifier', 'Keyword'])
const PINNED_COMMENT_PATTERN =
	/^\s*(?:\/|!|@ts-(?:no)?check\b|(?:eslint|oxlint)-(?:disable|enable)(?!-)|(?:eslint|oxlint|globals?|exported|jshint)\s|#(?:end)?region\b)|@(?:license|preserve|copyright|file|fileoverview|module|packageDocumentation|jsx\w*)\b|\bcopyright\b/i

const getLineGap = (previous: ESTree.Span, next: ESTree.Span) =>
	next.loc.start.line - previous.loc.end.line
const isPinnedComment = (comment: ESTree.Comment) =>
	comment.type === 'Shebang' || PINNED_COMMENT_PATTERN.test(comment.value)
const isJsDocComment = (comment: ESTree.Comment) =>
	comment.type === 'Block' && comment.value.startsWith('*')
const isOwnLineCommentAfter = (
	neighbour: Neighbour,
	statement: ProgramStatement
) =>
	(neighbour.type === 'Line' || neighbour.type === 'Block') &&
	neighbour.loc.start.line > statement.loc.end.line

/**
 * Requires each module-level type alias inferred from a Drizzle table
 * (`typeof table.$inferSelect`/`$inferInsert`) or Zod schema (`infer`,
 * `input` or `output` of `typeof schema`, through any local name of the
 * `zod` import: `z.infer`, `ns.z.infer` or a named `infer`) to sit in the run
 * of statements directly under its source, so several aliases of one source
 * may follow it consecutively. Sources are simple identifier bindings of
 * module-level variable declarations; imported, destructured and
 * function-local sources, aliases inside functions or namespaces, and types
 * that only nest an inferred type, such as `Omit<z.infer<typeof schema>, 'id'>`,
 * are not checked.
 * Every report carries the same atomic fix for the whole file, so one pass
 * moves each misplaced alias, with the comments directly above it and on its
 * line, under its source after the aliases already there, in original order.
 * A blank line follows a multi-line source, single-line CONSTANTS around a
 * vacated position stay together unless an own-line comment separates them,
 * and the file's newline style is kept. The fix is withheld when a moved alias
 * carries a file directive or header comment, starts the file under a
 * non-JSDoc comment, shares a line with other code, or when moving it could
 * change automatic semicolon insertion.
 */
export const inferredTypePlacementRule = defineRule({
	meta: {
		type: 'suggestion',
		docs: {
			description:
				'Types inferred from a table or schema sit directly under that declaration.',
		},
		fixable: 'code',
		messages: {
			misplacedInferredType:
				'Declare type {{ name }} directly under {{ source }}, the table or schema it is inferred from (AGENTS.md).',
		},
	},
	create(context) {
		const { sourceCode } = context

		function getLeadingComments(statement: ProgramStatement) {
			const previousToken = sourceCode.getTokenBefore(statement)
			const comments = sourceCode
				.getCommentsBefore(statement)
				.filter(
					comment => !previousToken || getLineGap(previousToken, comment) > 0
				)
			const detachedIndex = comments.findLastIndex(
				(comment, index) =>
					getLineGap(comment, comments[index + 1] ?? statement) > 1
			)

			return comments.slice(detachedIndex + 1)
		}

		function getTrailingComments(statement: ProgramStatement) {
			return sourceCode
				.getCommentsAfter(statement)
				.filter(comment => getLineGap(statement, comment) === 0)
		}

		function startsOwnStatementAfter(edge: BlockEdge) {
			const nextToken = sourceCode.getTokenAfter(edge)

			return (
				!nextToken ||
				(getLineGap(edge, nextToken) > 0 &&
					ASI_SAFE_TOKEN_TYPES.has(nextToken.type))
			)
		}

		function getMovedBlock(
			statement: ProgramStatement,
			index: number,
			sourceIndex: number
		): MovedBlock | undefined {
			const leading = getLeadingComments(statement)
			const trailing = getTrailingComments(statement)
			const first = leading[0] ?? statement
			const last = trailing.at(-1) ?? statement
			const previous =
				sourceCode.getTokenBefore(first, { includeComments: true }) ?? undefined
			const next =
				sourceCode.getTokenAfter(last, { includeComments: true }) ?? undefined

			if (
				[...leading, ...trailing].some(isPinnedComment) ||
				(!previous && leading[0] && !isJsDocComment(leading[0])) ||
				(previous && getLineGap(previous, first) === 0) ||
				(next && getLineGap(last, next) === 0) ||
				!startsOwnStatementAfter(last)
			)
				return

			return { index, sourceIndex, first, last, previous, next }
		}

		function groupAdjacentBlocks(blocks: readonly MovedBlock[]) {
			const regions: MovedBlock[][] = []

			for (const block of blocks) {
				const region = regions.at(-1)

				if (region?.at(-1)?.next?.start === block.first.start)
					region.push(block)
				else regions.push([block])
			}

			return regions
		}

		return {
			Program(program) {
				const statements = program.body
				const aliases = getInferredAliases(program)
				const newline = /\r\n?|\n/.exec(sourceCode.text)?.[0] ?? '\n'
				const misplacedIndexes: number[] = []
				const moverIndexes: number[] = []
				const anchorIndexes = new Map<number, number>()
				let runSourceIndex: number | undefined
				let boundaryIndex: number | undefined

				for (const [index, alias] of aliases.entries()) {
					if (!alias) {
						runSourceIndex = index
						boundaryIndex = index
						continue
					}
					if (alias.sourceIndex !== runSourceIndex) {
						misplacedIndexes.push(index)
						runSourceIndex = undefined
					}
					if (alias.sourceIndex === boundaryIndex)
						anchorIndexes.set(alias.sourceIndex, index)
					else moverIndexes.push(index)
				}

				function getRemovalEdit(region: readonly MovedBlock[]) {
					const [firstBlock] = region
					const lastBlock = region.at(-1)

					if (!(firstBlock && lastBlock)) return

					const { previous } = firstBlock
					const { next } = lastBlock

					if (!(previous && next))
						return {
							start: previous?.end ?? firstBlock.first.start,
							end: next?.start ?? lastBlock.last.end,
							text: '',
						}

					const previousStatement = statements[firstBlock.index - 1]
					const nextStatement = statements[lastBlock.index + 1]
					const keepsConstGroup =
						previousStatement &&
						nextStatement &&
						isSingleLineConstant(previousStatement) &&
						isSingleLineConstant(nextStatement) &&
						![previous, next].some(neighbour =>
							isOwnLineCommentAfter(neighbour, previousStatement)
						)
					const hasBlankLine = [
						getLineGap(previous, firstBlock.first),
						...region.map(block =>
							block.next ? getLineGap(block.last, block.next) : 0
						),
					].some(gap => gap > 1)

					return {
						start: previous.end,
						end: next.start,
						text:
							hasBlankLine && !keepsConstGroup
								? `${newline}${newline}`
								: newline,
					}
				}

				function getInsertionEdit(
					sourceIndex: number,
					blocks: readonly MovedBlock[]
				) {
					const anchorIndex = anchorIndexes.get(sourceIndex) ?? sourceIndex
					const anchor = statements[anchorIndex]

					if (!anchor) return

					const anchorEnd = getTrailingComments(anchor).at(-1) ?? anchor

					if (!startsOwnStatementAfter(anchorEnd)) return

					const opensWithBlankLine =
						anchorIndex === sourceIndex &&
						anchor.loc.end.line > anchor.loc.start.line

					return {
						start: anchorEnd.end,
						end: anchorEnd.end,
						text: blocks
							.map(
								(block, position) =>
									`${position === 0 && opensWithBlankLine ? newline : ''}${newline}${sourceCode.text.slice(block.first.start, block.last.end)}`
							)
							.join(''),
					}
				}

				function getRelocationEdits(): TextEdit[] | undefined {
					const blocks = moverIndexes.map(index => {
						const statement = statements[index]
						const alias = aliases[index]

						return (
							statement &&
							alias &&
							getMovedBlock(statement, index, alias.sourceIndex)
						)
					})
					const movedBlocks = blocks.filter(block => block !== undefined)

					if (movedBlocks.length !== blocks.length) return

					const blocksBySource = Map.groupBy(
						movedBlocks,
						block => block.sourceIndex
					)
					const edits = [
						...groupAdjacentBlocks(movedBlocks).map(getRemovalEdit),
						...[...blocksBySource].map(([sourceIndex, sourceBlocks]) =>
							getInsertionEdit(sourceIndex, sourceBlocks)
						),
					]
					const validEdits = edits.filter(edit => edit !== undefined)

					if (validEdits.length !== edits.length) return

					return validEdits.toSorted(
						(first, second) =>
							first.start - second.start || first.end - second.end
					)
				}

				function getRelocation(): TextEdit | undefined {
					const edits = getRelocationEdits()
					const [firstEdit] = edits ?? []

					if (
						!(edits && firstEdit) ||
						edits.some(
							(edit, index) => edit.start < (edits[index - 1]?.end ?? 0)
						)
					)
						return

					const { cursor, text } = edits.reduce(
						(merged, edit) => ({
							cursor: edit.end,
							text: `${merged.text}${sourceCode.text.slice(merged.cursor, edit.start)}${edit.text}`,
						}),
						{ cursor: firstEdit.start, text: '' }
					)

					return { start: firstEdit.start, end: cursor, text }
				}

				if (misplacedIndexes.length === 0) return

				const relocation = getRelocation()

				for (const index of misplacedIndexes) {
					const statement = statements[index]
					const alias = aliases[index]

					if (statement && alias)
						context.report({
							node: statement,
							messageId: 'misplacedInferredType',
							data: { name: alias.name, source: alias.source },
							fix: relocation
								? (fixer: Fixer) =>
										fixer.replaceTextRange(
											[relocation.start, relocation.end],
											relocation.text
										)
								: undefined,
						})
				}
			},
		}
	},
})
