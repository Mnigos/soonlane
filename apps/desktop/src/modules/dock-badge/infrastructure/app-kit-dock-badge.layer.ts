import { FFIType } from 'bun:ffi'
import { Effect, Layer } from 'effect'
import {
	getClass,
	getSelector,
	messageSender,
	utf8,
} from '../../../platform/macos/objc.helper'
import { DockBadge } from '../application/dock-badge.port'

const send = messageSender([], FFIType.ptr)
const sendString = messageSender([FFIType.cstring], FFIType.ptr)
const sendOnMainThread = messageSender(
	[FFIType.ptr, FFIType.ptr, FFIType.bool],
	FFIType.void
)

/** Sets the label of `NSApp.dockTile`; a nil label hides the badge. */
export const AppKitDockBadgeLive = Layer.succeed(
	DockBadge,
	DockBadge.of({
		show: count =>
			Effect.sync(() => {
				const dockTile = send(
					send(getClass('NSApplication'), getSelector('sharedApplication')),
					getSelector('dockTile')
				)
				const label =
					count > 0
						? sendString(
								send(getClass('NSString'), getSelector('alloc')),
								getSelector('initWithUTF8String:'),
								utf8(String(count))
							)
						: null

				// Electrobun runs this code in a Bun worker, but AppKit changes the tile only on the main thread; the call keeps the label alive until then.
				sendOnMainThread(
					dockTile,
					getSelector('performSelectorOnMainThread:withObject:waitUntilDone:'),
					getSelector('setBadgeLabel:'),
					label,
					false
				)
				if (label) send(label, getSelector('release'))
			}),
	})
)
