import { ConfigProvider, Effect, Layer } from 'effect'
import { AppConfig, AppConfigLive } from './app.config'

async function readConfig(values: Record<string, string>) {
	return await Effect.runPromise(
		AppConfig.pipe(
			Effect.provide(
				AppConfigLive.pipe(
					Layer.provide(
						ConfigProvider.layer(ConfigProvider.fromUnknown(values))
					)
				)
			)
		)
	)
}

describe('AppConfigLive', () => {
	test('reads the deployed commit and leaves the local version absent', async () => {
		const deployed = await readConfig({ VERCEL_GIT_COMMIT_SHA: 'abc123' })
		const local = await readConfig({})
		expect(deployed.version).toBe('abc123')
		expect(local.version).toBeUndefined()
	})

	test('uses the local app URL without settings', async () => {
		expect(await readConfig({})).toEqual({
			baseUrl: 'http://localhost:3000',
			trustedOrigins: ['http://localhost:3000'],
			version: undefined,
		})
	})

	test('derives a preview base URL from the Vercel branch host', async () => {
		const config = await readConfig({
			VERCEL_BRANCH_URL: 'soonlist-git-feature-team.vercel.app',
			VERCEL_URL: 'soonlist-abc123-team.vercel.app',
			VERCEL_GIT_COMMIT_SHA: '',
		})
		expect(config).toEqual({
			baseUrl: 'https://soonlist-git-feature-team.vercel.app',
			trustedOrigins: [
				'https://soonlist-git-feature-team.vercel.app',
				'https://soonlist-abc123-team.vercel.app',
			],
			version: undefined,
		})
	})

	test('treats empty Vercel settings as absent', async () => {
		const config = await readConfig({
			AUTH_URL: '',
			VERCEL_BRANCH_URL: '',
			VERCEL_URL: '',
		})
		expect(config.baseUrl).toBe('http://localhost:3000')
	})

	test('prefers AUTH_URL in production', async () => {
		const config = await readConfig({
			AUTH_URL: 'https://soonlist.vercel.app',
			VERCEL_URL: 'soonlist-abc123-team.vercel.app',
		})
		expect(config.baseUrl).toBe('https://soonlist.vercel.app')
		expect(config.trustedOrigins).toEqual([
			'https://soonlist.vercel.app',
			'https://soonlist-abc123-team.vercel.app',
		])
	})
})
