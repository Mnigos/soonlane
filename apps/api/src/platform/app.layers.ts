import { Layer } from 'effect'
import { AppConfigLive } from './config/app.config'
import { HttpServerLive } from './http/http-server.layer'

export const AppLive = HttpServerLive.pipe(Layer.provideMerge(AppConfigLive))
