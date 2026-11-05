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
		stylesheet: './apps/web/src/styles.css',
	},
	ignorePatterns: [
		...(ultracite.ignorePatterns ?? []),
		'**/*.svg',
		'**/.nitro',
		'**/.output',
		'**/.vercel',
		'**/routeTree.gen.ts',
		'packages/db/migrations/**',
		'docs/**',
	],
	overrides: [
		{
			files: ['**/*.json', '**/*.jsonc'],
			options: { useTabs: false },
		},
	],
})
