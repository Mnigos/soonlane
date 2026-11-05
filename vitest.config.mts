import { defineConfig } from 'vitest/config'

export default defineConfig({
	test: {
		projects: [
			'apps/web/vitest.config.ts',
			{
				test: {
					name: 'packages',
					globals: true,
					include: ['packages/*/*.spec.ts', 'packages/*/src/**/*.spec.ts'],
					exclude: ['packages/ui/**'],
				},
			},
			{
				test: {
					name: '@soonlist/ui',
					globals: true,
					include: ['packages/ui/src/**/*.spec.{ts,tsx}'],
				},
			},
			{
				test: {
					name: 'oxlint-plugins',
					include: ['tooling/oxlint-plugins/**/*.spec.ts'],
				},
			},
		],
	},
})
