import { defineConfig } from 'oxfmt'
import ultracite from 'ultracite/oxfmt'

export default defineConfig({
	...ultracite,
	arrowParens: 'avoid',
	insertFinalNewline: true,
	proseWrap: 'preserve',
	semi: false,
	singleQuote: true,
	useTabs: true,
	sortImports: { newlinesBetween: false, partitionByNewline: true },
	sortTailwindcss: {
		functions: ['cn', 'cva', 'clsx', 'twMerge'],
		stylesheet: './tooling/tailwind-config/theme.css',
	},
	ignorePatterns: [
		...(ultracite.ignorePatterns ?? []),
		'**/*.svg',
		'**/.nitro',
		'**/.output',
		'**/.vercel',
		'**/routeTree.gen.ts',
		'**/modern-screenshot.umd.js',
		'packages/db/migrations/**',
		// Written by the release workflow from git-cliff.
		'CHANGELOG.md',
		'.agents/skills/impeccable/**',
		'docs/**',
	],
	overrides: [
		{
			files: ['**/*.json', '**/*.jsonc'],
			options: { useTabs: false },
		},
	],
})
