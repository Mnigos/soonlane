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
	'Import other apps and packages through their aliases or @soonlist/* packages, not relative paths.'

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
	'soonlist/declaration-group-spacing': 'error',
	'soonlist/inferred-type-placement': 'error',
	'soonlist/type-param-prefix': 'error',
	'typescript/no-non-null-assertion': 'error',
} satisfies OxlintOverride['rules']

const FRONTEND_APPS = ['apps/web'] as const

const ROLE_NAMED_SOURCES = [
	'apps/web/src/**',
	'packages/*/*.ts',
	'packages/*/src/**',
	'packages/db/schema/**',
] as const

// Each override replaces no-restricted-imports wholesale, so every scope lists all restrictions that apply to it.
export const CONVENTION_OVERRIDES = [
	...WORKSPACES.map(workspace => ({
		files: [`${workspace}/**`],
		rules: {
			'no-restricted-imports': restrictImports(
				getCrossWorkspaceImports(workspace)
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
					FRONTEND_EFFECT_IMPORTS
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
					FRONTEND_QUERY_IMPORTS
				),
				'no-restricted-properties': 'off',
			},
		},
	]),
	{
		files: ['apps/**', 'packages/**'],
		rules: { 'soonlist/props-with-children': 'error' },
	},
	{
		files: [...ROLE_NAMED_SOURCES],
		rules: {
			'soonlist/file-role-suffix': 'error',
			'soonlist/file-role-folder': 'warn',
			'soonlist/hooks-dir-only-hooks': 'error',
		},
	},
	{
		files: ['**/*.repository.ts'],
		rules: { 'soonlist/no-repository-try-catch': 'error' },
	},
] satisfies OxlintOverride[]
