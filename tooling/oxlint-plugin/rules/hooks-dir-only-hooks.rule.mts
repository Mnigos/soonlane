import { defineRule } from '@oxlint/plugins'
import { hasSegment, toFilePath } from './file-role.helper.mts'

const HOOK_FILE_PATTERN = /^use-[a-z0-9]+(?:-[a-z0-9]+)*\.tsx?$/u

/**
 * Keeps `hooks/` directories (and any folder nested in one) to `use-*.ts(x)` hook files;
 * cache and query helpers belong elsewhere.
 */
export const hooksDirOnlyHooksRule = defineRule({
	meta: {
		type: 'suggestion',
		docs: {
			description: 'Files in a hooks/ directory are use-*.ts(x) hooks.',
		},
		messages: {
			notAHook:
				'Only use-*.ts(x) hooks live in hooks/; move helpers to helpers/ (AGENTS.md).',
		},
	},
	create(context) {
		const file = toFilePath(context.filename)

		return {
			Program(node) {
				if (!hasSegment(file, 'hooks') || HOOK_FILE_PATTERN.test(file.basename))
					return

				context.report({ node, messageId: 'notAHook' })
			},
		}
	},
})
