import { defineConfig, type OxlintOverride } from 'oxlint'
import core from 'ultracite/oxlint/core'
import react from 'ultracite/oxlint/react'
import tanstack from 'ultracite/oxlint/tanstack'
import {
	CONVENTION_OVERRIDES,
	CONVENTION_RULES,
} from './oxlint.conventions.mts'

const DISABLED_RULES = {
	'class-methods-use-this':
		'Effect services and errors use getters without this',
	'func-names': 'anonymous function expressions are fine as callbacks',
	'max-classes-per-file': 'error files group related tagged errors',
	'no-await-in-loop': 'sequential scripts are intentional',
	'no-plusplus': 'increment operators are idiomatic in counters and loops',
	'prefer-named-capture-group':
		'positional groups are clearer in short regexes',
	'require-await':
		'conflicts with typescript/promise-function-async on pass-through promise callbacks',
	'import/consistent-type-specifier-style':
		'inline type specifiers are allowed in mixed imports',
	'node/callback-return':
		'oRPC and Effect middleware yield next(), not Node-style callbacks',
	'promise/prefer-await-to-callbacks': 'React callbacks',
	'promise/prefer-await-to-then': 'fire-and-forget void promises',
	'react/display-name':
		'render callbacks and formatters that return JSX are not components',
	'react/function-component-definition':
		'concise arrow components are allowed by AGENTS.md',
	'react/jsx-handler-names':
		'handler props follow component APIs, not a handle prefix',
	'typescript/no-confusing-void-expression':
		'concise void-returning arrow callbacks per AGENTS.md',
	'typescript/non-nullable-type-assertion-style':
		'pushes towards non-null assertions, banned by AGENTS.md',
	'typescript/prefer-nullish-coalescing':
		'AGENTS.md uses || for intentional all-falsy checks',
	'typescript/strict-boolean-expressions':
		'truthiness checks and || fallbacks are intentional',
	'typescript/unbound-method': 'Effect and oRPC pass methods as references',
	'unicorn/import-style': 'named imports from Node builtins are the convention',
	'unicorn/no-array-reduce': 'reduce is accepted for aggregations',
	'unicorn/no-useless-undefined':
		'AGENTS.md prefers explicit undefined at API boundaries',
	'unicorn/prefer-ternary': 'AGENTS.md prefers early returns over ternaries',
	'unicorn/switch-case-braces':
		'AGENTS.md skips braces for single-statement blocks',
} as const satisfies Record<string, string>

/** tooling/oxlint-plugins is copied verbatim from vinyl-wishlist (originally rigtch.fm), which still defers these rules; fix them upstream before removing an entry. */
const VENDORED_PLUGIN_DEFERRED_RULES = [
	'require-unicode-regexp',
	'soonlane/no-let',
	'typescript/consistent-return',
	'typescript/no-unnecessary-type-assertion',
	'typescript/strict-void-return',
	'unicorn/consistent-function-scoping',
] as const

const PRESETS = [core, react, tanstack]

export default defineConfig({
	extends: PRESETS,
	ignorePatterns: [
		...(core.ignorePatterns ?? []),
		'.claude/**',
		'.agents/skills/impeccable/scripts/**',
		'**/.nitro',
		'**/.output',
		'**/.vercel',
		'**/routeTree.gen.ts',
		'packages/db/migrations/**',
	],
	jsPlugins: ['./tooling/oxlint-plugins/soonlane.plugin.mts'],
	options: { typeAware: true },
	env: { browser: true, node: true, es2024: true },
	globals: { Bun: 'readonly' },
	rules: {
		...Object.fromEntries(
			Object.keys(DISABLED_RULES).map(rule => [rule, 'off'])
		),
		curly: 'off',
		'func-style': ['error', 'declaration', { allowArrowFunctions: true }],
		'no-nested-ternary': 'off',
		'no-undef': 'error',
		'no-use-before-define': [
			'error',
			{
				classes: false,
				functions: false,
				ignoreTypeReferences: true,
				typedefs: false,
				variables: false,
			},
		],
		'no-void': 'off',
		'oxc/no-barrel-file': 'off',
		'prefer-arrow-callback': ['error', { allowNamedFunctions: true }],
		'react/jsx-no-useless-fragment': ['error', { allowExpressions: true }],
		'typescript/consistent-type-imports': [
			'error',
			{ disallowTypeAnnotations: false },
		],
		'typescript/no-misused-promises': [
			'error',
			{ checksVoidReturn: { attributes: false } },
		],
		'typescript/only-throw-error': [
			'error',
			{
				allow: [
					{
						from: 'package',
						package: '@tanstack/router-core',
						name: 'Redirect',
					},
					{
						from: 'package',
						package: '@tanstack/router-core',
						name: 'NotFoundError',
					},
				],
			},
		],
		'typescript/switch-exhaustiveness-check': [
			'error',
			{ considerDefaultExhaustiveForUnions: true },
		],
		...CONVENTION_RULES,
	},
	overrides: [
		{
			// The one brand cast, in fromUtcDate (soonlane/no-brand-cast).
			files: ['packages/domain/src/dates/calendar-date.helper.ts'],
			rules: { 'typescript/no-unsafe-type-assertion': 'off' },
		},
		{
			// gh api responses and the Actions event payload are trusted GitHub JSON; the workflow runs without bun install, so there is no Zod to parse them with.
			files: ['.github/scripts/**'],
			rules: {
				'typescript/no-unsafe-assignment': 'off',
				'typescript/no-unsafe-return': 'off',
				'typescript/strict-void-return': 'off',
			},
		},
		{
			files: ['scripts/**', 'apps/web/scripts/**', 'packages/db/scripts/**'],
			rules: { 'no-console': 'off' },
		},
		{
			files: ['apps/web/**'],
			rules: { 'soonlane/hook-query-naming': 'error' },
		},
		{
			files: ['apps/**/*.tsx', 'packages/**/*.tsx'],
			rules: { 'soonlane/jsx-sibling-spacing': 'error' },
		},
		{
			files: [
				'apps/web/**',
				'apps/api/src/**',
				'apps/desktop/src/**',
				'packages/*/src/**',
				'packages/*/schema/**',
			],
			rules: { 'oxc/no-barrel-file': ['error', { threshold: 0 }] },
		},
		{
			files: ['packages/db/schema/**'],
			rules: { 'import/no-cycle': 'off' },
		},
		{
			// Drizzle relational queries load the whole schema via `import * as schema` and `@soonlane/db` re-exports it as public API.
			files: ['packages/db/schema/index.ts'],
			rules: { 'oxc/no-barrel-file': 'off' },
		},
		{
			files: ['tooling/oxlint-plugins/**'],
			rules: Object.fromEntries(
				VENDORED_PLUGIN_DEFERRED_RULES.map(rule => [rule, 'off'])
			),
		},
		...CONVENTION_OVERRIDES,
	] satisfies OxlintOverride[],
})
