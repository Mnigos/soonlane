import type { WithEffectContext } from '@orpc/effect'
import { hasAnalyticsConsent } from '@soonlane/analytics'
import { Context } from 'effect'
import { AnalyticsConsent } from '@/modules/analytics/application/analytics.port'
import {
	Auth,
	type AuthSession,
} from '@/modules/identity/application/auth.port'
import type { AppServices } from '../app.runtime'
import { AppConfig } from '../config/app.config'

export interface RpcContext extends WithEffectContext<AppServices> {
	session: AuthSession | null
}

/** The context of one RPC request and the `Set-Cookie` values its session lookup produced, which go onto that request's response. */
export async function createRpcContext(
	services: Context.Context<AppServices>,
	headers: Headers
): Promise<{ context: RpcContext; setCookies: string[] }> {
	const { session, setCookies } = await Context.get(services, Auth).getSession(
		headers
	)

	return {
		context: {
			'effect/context': Context.add(
				services,
				AnalyticsConsent,
				hasAnalyticsConsent(
					headers,
					Context.get(services, AppConfig).cookiePrefix
				)
			),
			session,
		},
		setCookies,
	}
}
