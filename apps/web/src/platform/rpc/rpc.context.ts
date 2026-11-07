import type { WithEffectContext } from '@orpc/experimental-effect'
import { Context } from 'effect'
import { AnalyticsConsent } from '@/modules/analytics/application/analytics.port'
import { hasAnalyticsConsent } from '@/modules/consent/domain/consent.helper'
import {
	Auth,
	type AuthSession,
} from '@/modules/identity/application/auth.port'
import type { AppServices } from '../app.runtime'

export interface RpcContext extends WithEffectContext<AppServices> {
	session: AuthSession | null
}

export async function createRpcContext(
	services: Context.Context<AppServices>,
	headers: Headers
): Promise<RpcContext> {
	const session = await Context.get(services, Auth).getSession(headers)

	return {
		'effect/context': Context.add(
			services,
			AnalyticsConsent,
			hasAnalyticsConsent(headers)
		),
		session,
	}
}
