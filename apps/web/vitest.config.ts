import { configDefaults, defineConfig } from 'vitest/config'

export default defineConfig({
	resolve: {
		tsconfigPaths: true,
	},
	test: {
		name: '@soonlist/web',
		globals: true,
		include: ['src/**/*.spec.{ts,tsx}'],
		exclude: [...configDefaults.exclude, '**/*.integration.spec.ts'],
	},
})
