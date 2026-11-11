import { readdirSync } from 'node:fs'
import { posix } from 'node:path'
import { defineRule, type ESTree } from '@oxlint/plugins'
import { getRoleSuffix, toFilePath } from './file-role.helper.mts'

const MODULE_FILE_PATTERN =
	/^(.*\/)?apps\/(?:web|api)\/src\/modules\/([^/]+)\//u
const CONTRACT_FILE_PATTERN =
	/^(.*\/)?packages\/contracts\/src\/([a-z0-9-]+)\.contract\.ts$/u
const MODULE_NAMED_ROLES = new Set(['service', 'router'])
const ROOT_CONTRACT = 'app'
const namespacesByRoot = new Map<string, Set<string>>()

/** Platform folders such as `system` own oRPC namespaces too. */
function getNamespaces(root: string) {
	const cached = namespacesByRoot.get(root)

	if (cached) return cached

	const namespaces = new Set(
		['modules', 'platform'].flatMap(folder =>
			readdirSync(posix.join(root, 'apps/api/src', folder), {
				withFileTypes: true,
			})
				.filter(entry => entry.isDirectory())
				.map(entry => entry.name)
		)
	)

	namespacesByRoot.set(root, namespaces)

	return namespaces
}

function toPascalCase(name: string) {
	return name
		.split('-')
		.map(word => word.charAt(0).toUpperCase() + word.slice(1))
		.join('')
}

function getExportedClassNames(program: ESTree.Program) {
	return program.body.flatMap(statement =>
		statement.type === 'ExportNamedDeclaration' &&
		statement.declaration?.type === 'ClassDeclaration' &&
		statement.declaration.id
			? [statement.declaration.id.name]
			: []
	)
}

/**
 * Keeps names tied to their module (AGENTS.md module names). Inside
 * `apps/web/src/modules/<module>/` or `apps/api/src/modules/<module>/`, `.service.ts` and `.router.ts` files are
 * named `<module>`, and a service file exports `<Module>Service`. A
 * `packages/contracts/src/<name>.contract.ts` names an API module or an
 * API `platform/` folder; the root `app.contract.ts` is exempt. Files about one
 * entity (`task.repository.ts`, `task.errors.ts`) are not checked.
 */
export const moduleNameRule = defineRule({
	meta: {
		type: 'suggestion',
		docs: {
			description:
				'Module services, routers and contracts reuse the module name as is.',
		},
		messages: {
			wrongFileName:
				'A .{{role}}.ts file in modules/{{module}} is named {{module}}.{{role}}.ts (AGENTS.md module names).',
			missingServiceClass:
				'{{module}}.service.ts exports the {{className}} class (AGENTS.md module names).',
			unknownContract:
				'{{name}}.contract.ts names no module in apps/api/src/modules or folder in apps/api/src/platform (AGENTS.md module names).',
		},
	},
	create(context) {
		const file = toFilePath(context.filename)
		const moduleMatch = MODULE_FILE_PATTERN.exec(file.path)
		const contractMatch = CONTRACT_FILE_PATTERN.exec(file.path)

		return {
			Program(node) {
				if (contractMatch) {
					const [, root = '', name = ''] = contractMatch

					if (name === ROOT_CONTRACT || getNamespaces(root || '.').has(name))
						return

					context.report({ node, messageId: 'unknownContract', data: { name } })

					return
				}

				const module = moduleMatch?.[2]
				const role = getRoleSuffix(file)

				if (!(module && role && MODULE_NAMED_ROLES.has(role))) return

				if (file.basename.split('.')[0] !== module) {
					context.report({
						node,
						messageId: 'wrongFileName',
						data: { role, module },
					})

					return
				}

				const className = `${toPascalCase(module)}Service`

				if (
					role === 'service' &&
					!getExportedClassNames(node).includes(className)
				)
					context.report({
						node,
						messageId: 'missingServiceClass',
						data: { module, className },
					})
			},
		}
	},
})
