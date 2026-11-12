import { readdirSync } from 'node:fs'
import { basename, dirname, join } from 'node:path'
import type { OxlintOverride } from 'oxlint'

interface RestrictedImportEntry {
	importNames?: readonly string[]
	message: string
}

interface RestrictedImportPath extends RestrictedImportEntry {
	name: string
}

interface RestrictedImportPattern extends RestrictedImportEntry {
	regex: string
}

interface ImportRestriction {
	paths?: readonly RestrictedImportPath[]
	patterns?: readonly RestrictedImportPattern[]
}

const CROSS_WORKSPACE_IMPORT_MESSAGE =
	'Import other apps and packages through their aliases or @soonlane/* packages, not relative paths.'

const WORKSPACE_GROUPS = ['apps', 'packages', 'tooling'] as const

const WORKSPACES = WORKSPACE_GROUPS.flatMap(group =>
	readdirSync(join(import.meta.dirname, group), { withFileTypes: true })
		.filter(entry => entry.isDirectory())
		.map(entry => `${group}/${entry.name}`)
)

function getCrossWorkspaceImports(workspace: string) {
	const siblings = WORKSPACES.filter(
		other => other !== workspace && dirname(other) === dirname(workspace)
	).map(other => basename(other))
	const regexes = [
		String.raw`^(\.\./)+(${WORKSPACE_GROUPS.join('|')})/`,
		...(siblings.length > 0
			? [String.raw`^(\.\./)+(${siblings.join('|')})(/|$)`]
			: []),
	]

	return {
		patterns: regexes.map(regex => ({
			regex,
			message: CROSS_WORKSPACE_IMPORT_MESSAGE,
		})),
	} satisfies ImportRestriction
}

const FRONTEND_QUERY_IMPORTS = {
	paths: [
		{
			name: '@tanstack/react-query',
			importNames: [
				'useSuspenseQuery',
				'useSuspenseQueries',
				'useSuspenseInfiniteQuery',
			],
			message:
				'Use useQuery with explicit loading, error, empty and success states (AGENTS.md: do not use useSuspenseQuery).',
		},
	],
} as const satisfies ImportRestriction

const TANSTACK_MUTATION_OPTIONS_IMPORT = {
	paths: [
		{
			name: '@tanstack/react-query',
			importNames: ['mutationOptions'],
			message: 'Pass options straight to useMutation.',
		},
	],
} as const satisfies ImportRestriction

const FRONTEND_EFFECT_MESSAGE =
	'Derive state, use event handlers or TanStack Query; only reusable use-*.ts hooks may wrap useEffect (AGENTS.md).'

const FRONTEND_EFFECT_IMPORTS = {
	paths: [
		{
			name: 'react',
			importNames: ['useEffect'],
			message: FRONTEND_EFFECT_MESSAGE,
		},
	],
} as const satisfies ImportRestriction

const FRONTEND_ROUTER_IMPORTS = {
	paths: [
		{
			name: '@tanstack/react-router',
			importNames: [
				'useSearch',
				'useParams',
				'useLoaderData',
				'useRouteContext',
				'useMatch',
				'useMatches',
				'useMatchRoute',
				'useLocation',
				'useRouterState',
				'getRouteApi',
			],
			message:
				'Read router state in *.route.tsx with Route.useX() and pass it down as props (AGENTS.md).',
		},
	],
	patterns: [
		{
			regex: String.raw`\.route(?:\.[jt]sx?)?$`,
			message:
				'Components do not import route files; the route passes its data as props.',
		},
	],
} as const satisfies ImportRestriction

function toRestrictionEntries<TEntry extends RestrictedImportEntry>(
	entries: readonly TEntry[] = []
) {
	return entries.map(({ importNames, ...entry }) => ({
		...entry,
		...(importNames && { importNames: [...importNames] }),
	}))
}

function restrictImports(...restrictions: readonly ImportRestriction[]) {
	return [
		'error',
		{
			paths: restrictions.flatMap(({ paths }) => toRestrictionEntries(paths)),
			patterns: restrictions.flatMap(({ patterns }) =>
				toRestrictionEntries(patterns)
			),
		},
	] satisfies NonNullable<OxlintOverride['rules']>['no-restricted-imports']
}

// oxlint config types use mutable tuples, so rule maps below use satisfies without as const.

export const CONVENTION_RULES = {
	'max-lines': ['error', { max: 400 }],
	'soonlane/declaration-group-spacing': 'error',
	'soonlane/declaration-jsdoc': 'error',
	'soonlane/inferred-type-placement': 'error',
	'soonlane/no-let': 'error',
	'soonlane/type-param-prefix': 'error',
	'typescript/no-non-null-assertion': 'error',
} satisfies OxlintOverride['rules']

const FRONTEND_APPS = ['apps/web'] as const

/** The private `fromUtcDate` brands every date the domain computes; the domain's brand schemas brand parsed values with Zod's `.brand()`. */
const BRAND_CAST_FILE = 'packages/domain/src/dates/calendar-date.helper.ts'

/** Process entry points that start the app runtime itself, so no app runtime exists yet to run through. */
const DEFAULT_RUNTIME_FILES = [
	'apps/api/src/main.ts',
	'apps/desktop/src/main.ts',
] as const

const TASKS_INFRASTRUCTURE = 'apps/api/src/modules/tasks/infrastructure'

/** Where ownedTasks and ownedBy are defined: the only file that reads task.ownerId. */
const TASK_OWNER_SCOPE_FILE = `${TASKS_INFRASTRUCTURE}/owned-tasks.query.ts`

/** Single statements on the task table that take the owner condition from ownedBy instead of going through ownedTasks. */
const TASK_STATEMENT_FILES = [
	`${TASKS_INFRASTRUCTURE}/task-progress.query.ts`,
	`${TASKS_INFRASTRUCTURE}/task-update.query.ts`,
	'apps/api/src/modules/labels/infrastructure/label.repository.ts',
] as const

const ROLE_NAMED_SOURCES = [
	'apps/web/src/**',
	'apps/api/src/**',
	'apps/desktop/src/**',
	'packages/*/*.ts',
	'packages/*/src/**',
	'packages/db/schema/**',
] as const

/** Each override replaces no-restricted-imports wholesale, so every scope lists all restrictions that apply to it. */
export const CONVENTION_OVERRIDES = [
	...WORKSPACES.map(workspace => ({
		files: [`${workspace}/**`],
		rules: {
			'no-restricted-imports': restrictImports(
				getCrossWorkspaceImports(workspace),
				TANSTACK_MUTATION_OPTIONS_IMPORT
			),
		},
	})),
	...FRONTEND_APPS.flatMap(app => [
		{
			files: [`${app}/**`],
			rules: {
				'no-restricted-imports': restrictImports(
					getCrossWorkspaceImports(app),
					FRONTEND_QUERY_IMPORTS,
					FRONTEND_EFFECT_IMPORTS,
					TANSTACK_MUTATION_OPTIONS_IMPORT,
					FRONTEND_ROUTER_IMPORTS
				),
				'no-restricted-properties': [
					'error',
					{
						object: 'React',
						property: 'useEffect',
						message: FRONTEND_EFFECT_MESSAGE,
					},
				],
			},
		},
		{
			files: [`${app}/src/**/use-*.ts`],
			rules: {
				'no-restricted-imports': restrictImports(
					getCrossWorkspaceImports(app),
					FRONTEND_QUERY_IMPORTS,
					TANSTACK_MUTATION_OPTIONS_IMPORT,
					FRONTEND_ROUTER_IMPORTS
				),
				'no-restricted-properties': 'off',
			},
		},
		{
			files: [`${app}/src/**/*.route.tsx`],
			rules: {
				'no-restricted-imports': restrictImports(
					getCrossWorkspaceImports(app),
					FRONTEND_QUERY_IMPORTS,
					FRONTEND_EFFECT_IMPORTS,
					TANSTACK_MUTATION_OPTIONS_IMPORT
				),
			},
		},
	]),
	{
		files: ['apps/**', 'packages/**'],
		rules: { 'soonlane/props-with-children': 'error' },
	},
	{
		files: [...ROLE_NAMED_SOURCES],
		rules: {
			'soonlane/file-role-suffix': 'error',
			'soonlane/file-role-folder': 'warn',
			'soonlane/hooks-dir-only-hooks': 'error',
		},
	},
	{
		files: [
			'apps/web/src/modules/**',
			'apps/api/src/modules/**',
			'packages/contracts/src/*.contract.ts',
		],
		rules: { 'soonlane/module-name': 'error' },
	},
	{
		files: ['apps/**', 'packages/**'],
		rules: { 'soonlane/no-brand-cast': 'error' },
	},
	{
		files: [BRAND_CAST_FILE],
		rules: { 'soonlane/no-brand-cast': 'off' },
	},
	{
		files: ['apps/**'],
		rules: {
			'soonlane/no-default-runtime': 'error',
			'soonlane/redacted-secret-config': 'error',
		},
	},
	{
		files: [...DEFAULT_RUNTIME_FILES],
		rules: { 'soonlane/no-default-runtime': 'off' },
	},
	{
		files: ['apps/web/**'],
		rules: { 'soonlane/no-api-only-import': 'error' },
	},
	{
		files: ['apps/**', 'packages/**'],
		rules: { 'soonlane/task-owner-scope': 'error' },
	},
	{
		files: [...TASK_STATEMENT_FILES],
		rules: {
			'soonlane/task-owner-scope': ['error', { allowTableQueries: true }],
		},
	},
	{
		files: [TASK_OWNER_SCOPE_FILE],
		rules: { 'soonlane/task-owner-scope': 'off' },
	},
	{
		files: [
			'**/*.repository.ts',
			'**/*.repository.server.ts',
			'**/*.query.ts',
			'**/*.query.server.ts',
		],
		rules: { 'soonlane/no-repository-try-catch': 'error' },
	},
	{
		files: ['apps/**', 'packages/**'],
		rules: { 'soonlane/cors-at-entry': 'error' },
	},
	{
		files: ['apps/api/src/platform/http/cors.helper.ts'],
		rules: { 'soonlane/cors-at-entry': 'off' },
	},
] satisfies OxlintOverride[]
