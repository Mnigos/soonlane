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
