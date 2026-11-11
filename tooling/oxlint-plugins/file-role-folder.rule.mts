import { defineRule } from '@oxlint/plugins'
import {
	getRoleSuffix,
	hasSegment,
	type RoleSuffix,
	toFilePath,
} from './file-role.helper.mts'

const ROLE_FOLDERS = {
	repository: ['infrastructure'],
	layer: ['infrastructure', 'platform'],
	parser: ['infrastructure'],
	client: [
		'infrastructure',
		'presentation',
		'platform/rpc',
		'packages/auth',
		'packages/analytics',
	],
	port: ['application'],
	service: ['application'],
	util: ['src/utils'],
} as const satisfies Partial<Record<RoleSuffix, readonly string[]>>

type FolderBoundRole = keyof typeof ROLE_FOLDERS

function isFolderBoundRole(role: string | undefined): role is FolderBoundRole {
	return role !== undefined && Object.hasOwn(ROLE_FOLDERS, role)
}

/**
 * Warns when a role-suffixed file sits outside the layer that owns the role,
 * e.g. a `.repository.ts` outside `infrastructure/` or a `.port.ts` outside
 * `application/`.
 */
export const fileRoleFolderRule = defineRule({
	meta: {
		type: 'suggestion',
		docs: {
			description: 'Role-suffixed files live in the folder that owns the role.',
		},
		messages: {
			wrongFolder:
				'A .{{role}}.ts file belongs in {{folders}} (AGENTS.md naming table).',
		},
	},
	create(context) {
		const file = toFilePath(context.filename)
		const role = getRoleSuffix(file)

		return {
			Program(node) {
				if (!isFolderBoundRole(role)) return

				const folders: readonly string[] = ROLE_FOLDERS[role]

				if (folders.some(folder => hasSegment(file, folder))) return

				context.report({
					node,
					messageId: 'wrongFolder',
					data: {
						role,
						folders: folders.map(folder => `${folder}/`).join(' or '),
					},
				})
			},
		}
	},
})
