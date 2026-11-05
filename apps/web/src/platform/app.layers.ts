import { Layer } from 'effect'
import { AppConfigLive } from './config/app.config'
import { DbLive } from './db/db.layer'

export const AppLive = DbLive.pipe(Layer.provideMerge(AppConfigLive))
