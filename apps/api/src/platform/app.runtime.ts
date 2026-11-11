import { type Layer, ManagedRuntime } from 'effect'
import { AppLive, type ServicesLive } from './app.layers'

export type AppServices = Layer.Success<typeof ServicesLive>

export const runtime = ManagedRuntime.make(AppLive)
