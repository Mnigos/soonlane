import {
	LOCAL_APP_URL,
	resolveBaseUrl,
	resolveTrustedOrigins,
} from './app-url.helper'

describe('resolveBaseUrl', () => {
	test.each([
		[{ authUrl: 'https://soonlist.vercel.app' }, 'https://soonlist.vercel.app'],
		[
			{
				authUrl: 'https://soonlist.vercel.app',
				vercelBranchUrl: 'soonlist-git-feature-team.vercel.app',
				vercelUrl: 'soonlist-abc123-team.vercel.app',
			},
			'https://soonlist.vercel.app',
		],
		[
			{
				vercelBranchUrl: 'soonlist-git-feature-team.vercel.app',
				vercelUrl: 'soonlist-abc123-team.vercel.app',
			},
			'https://soonlist-git-feature-team.vercel.app',
		],
		[
			{ vercelUrl: 'soonlist-abc123-team.vercel.app' },
			'https://soonlist-abc123-team.vercel.app',
		],
		[{}, LOCAL_APP_URL],
	])('resolves %o to %s', (urls, expected) => {
		expect(resolveBaseUrl(urls)).toBe(expected)
	})
})

describe('resolveTrustedOrigins', () => {
	test('trusts the base URL and both preview hosts without duplicates', () => {
		expect(
			resolveTrustedOrigins({
				vercelBranchUrl: 'soonlist-git-feature-team.vercel.app',
				vercelUrl: 'soonlist-abc123-team.vercel.app',
			})
		).toEqual([
			'https://soonlist-git-feature-team.vercel.app',
			'https://soonlist-abc123-team.vercel.app',
		])
	})

	test('reduces AUTH_URL with a path to its origin', () => {
		expect(
			resolveTrustedOrigins({
				authUrl: 'https://soonlist.vercel.app/api/auth',
				vercelUrl: 'soonlist-abc123-team.vercel.app',
			})
		).toEqual([
			'https://soonlist.vercel.app',
			'https://soonlist-abc123-team.vercel.app',
		])
	})

	test('trusts only localhost without deployment settings', () => {
		expect(resolveTrustedOrigins({})).toEqual(['http://localhost:3000'])
	})
})
