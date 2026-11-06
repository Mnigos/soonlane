import { defineRule, type ESTree, type Fixer } from '@oxlint/plugins'

type JsxParent = ESTree.JSXElement | ESTree.JSXFragment
type JsxChild = JsxParent['children'][number]

// Phrasing hosts: their children form an inline label (icon + text, weekday + day number), so they stay tight.
const INLINE_HOSTS = new Set([
	'a',
	'abbr',
	'b',
	'button',
	'code',
	'em',
	'h1',
	'h2',
	'h3',
	'h4',
	'h5',
	'h6',
	'i',
	'label',
	'p',
	'small',
	'span',
	'strong',
	'Button',
	'Link',
])
const NEWLINE_PATTERN = /\n/gu

function isWhitespaceText(child: JsxChild) {
	return child.type === 'JSXText' && child.value.trim() === ''
}

function getHostName(parent: JsxParent) {
	if (parent.type === 'JSXFragment') return undefined

	const { name } = parent.openingElement

	return name.type === 'JSXIdentifier' ? name.name : undefined
}

function isInlineRun(parent: JsxParent) {
	const host = getHostName(parent)

	if (host && INLINE_HOSTS.has(host)) return true

	return parent.children.some(
		child =>
			(child.type === 'JSXText' && child.value.trim() !== '') ||
			(child.type === 'JSXExpressionContainer' &&
				child.expression.type === 'JSXEmptyExpression')
	)
}

/**
 * Separates sibling JSX children of a block parent with exactly one blank
 * line. Inline runs keep their siblings tight: phrasing hosts such as `p`,
 * `span`, headings, `button` and `Link`, parents with text children, and
 * siblings that share a line.
 */
export const jsxSiblingSpacingRule = defineRule({
	meta: {
		type: 'layout',
		docs: {
			description:
				'Sibling JSX children of a block parent are separated by one blank line.',
		},
		fixable: 'whitespace',
		messages: {
			separateSiblings:
				'Separate sibling JSX children with exactly one blank line (AGENTS.md).',
		},
	},
	create(context) {
		const { sourceCode } = context

		function check(parent: JsxParent) {
			if (isInlineRun(parent)) return

			const siblings = parent.children.filter(child => !isWhitespaceText(child))

			for (const [index, next] of siblings.entries()) {
				const previous = siblings[index - 1]

				if (!previous) continue

				const gap = sourceCode.text.slice(previous.end, next.start)
				const newlines = gap.match(NEWLINE_PATTERN)?.length ?? 0

				// Siblings on one line form an inline run; leave the whole parent alone.
				if (newlines === 0) return

				const indentation = gap.slice(gap.lastIndexOf('\n') + 1)
				const expected = `\n\n${indentation}`

				if (gap !== expected)
					context.report({
						node: next,
						messageId: 'separateSiblings',
						fix: (fixer: Fixer) =>
							fixer.replaceTextRange([previous.end, next.start], expected),
					})
			}
		}

		return {
			JSXElement: check,
			JSXFragment: check,
		}
	},
})
