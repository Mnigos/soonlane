import { ManagedRuntime } from 'effect'
import { AppLive } from './app.layers'

export const runtime = ManagedRuntime.make(AppLive)
