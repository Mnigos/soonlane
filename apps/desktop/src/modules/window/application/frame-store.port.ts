import { Context, type Effect, type Option } from 'effect'
import type { WindowFrame } from '../domain/window-frame.schemas'
import type { FrameStoreError } from '../domain/window.errors'

export class FrameStore extends Context.Service<
	FrameStore,
	{
		readonly load: Effect.Effect<Option.Option<WindowFrame>>
		// Synchronous, so it can finish inside the window's close callback.
		readonly save: (frame: WindowFrame) => Effect.Effect<void, FrameStoreError>
	}
>()('soonlane/FrameStore') {}
