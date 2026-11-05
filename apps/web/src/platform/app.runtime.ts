import { type Layer, ManagedRuntime } from 'effect'
import { AppLive } from './app.layers'

export type AppServices = Layer.Success<typeof AppLive>

export const runtime = ManagedRuntime.make(AppLive)
