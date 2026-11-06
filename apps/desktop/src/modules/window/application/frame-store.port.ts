import { Context, type Effect, type Option } from 'effect'
import type { WindowFrame } from '../domain/window-frame.schemas'
import type { FrameStoreError } from '../domain/window.errors'

export class FrameStore extends Context.Service<
	FrameStore,
	{
		/** The last saved frame; none on the first launch or when the saved state is unreadable. */
		readonly load: Effect.Effect<Option.Option<WindowFrame>>
		/** Runs synchronously, so it can finish inside the window's close callback. */
		readonly save: (frame: WindowFrame) => Effect.Effect<void, FrameStoreError>
	}
>()('soonlist/FrameStore') {}
