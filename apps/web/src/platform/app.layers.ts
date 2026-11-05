import { Layer } from 'effect'
import { BetterAuthLive } from '@/modules/identity/infrastructure/better-auth.layer'
import { AppConfigLive } from './config/app.config'
import { DbLive } from './db/db.layer'

export const AppLive = BetterAuthLive.pipe(
	Layer.provideMerge(DbLive),
	Layer.provideMerge(AppConfigLive)
)
