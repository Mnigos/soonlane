import { FFIType } from 'bun:ffi'
import { Effect, Layer } from 'effect'
import {
	getClass,
	getSelector,
	messageSender,
	utf8,
	withAutoreleasePool,
} from '../../../platform/macos/objc.helper'
import { DockBadge } from '../application/dock-badge.port'

const send = messageSender([], FFIType.ptr)
const sendPointer = messageSender([FFIType.ptr], FFIType.ptr)
const sendString = messageSender([FFIType.cstring], FFIType.ptr)
const sendArgument = messageSender([FFIType.ptr, FFIType.i64], FFIType.void)
const sendOnMainThread = messageSender(
	[FFIType.ptr, FFIType.ptr, FFIType.bool],
	FFIType.void
)

function createString(text: string) {
	return sendString(
		send(getClass('NSString'), getSelector('alloc')),
		getSelector('initWithUTF8String:'),
		utf8(text)
	)
}

/** Sets `NSApp.dockTile.badgeLabel`; a nil label hides the badge. */
export const AppKitDockBadgeLive = Layer.succeed(
	DockBadge,
	DockBadge.of({
		show: count =>
			Effect.sync(() =>
				withAutoreleasePool(() => {
					const target = getClass('NSApplication')
					const selector = getSelector('setValue:forKeyPath:')
					const invocation = sendPointer(
						getClass('NSInvocation'),
						getSelector('invocationWithMethodSignature:'),
						sendPointer(
							getClass('NSObject'),
							getSelector('instanceMethodSignatureForSelector:'),
							selector
						)
					)
					const label = count > 0 ? createString(String(count)) : null
					const keyPath = createString('sharedApplication.dockTile.badgeLabel')
					const setArgument = (
						value: ReturnType<typeof createString> | null,
						index: number
					) =>
						sendArgument(
							invocation,
							getSelector('setArgument:atIndex:'),
							new BigUint64Array([BigInt(value ?? 0)]),
							index
						)

					sendPointer(invocation, getSelector('setTarget:'), target)
					sendPointer(invocation, getSelector('setSelector:'), selector)
					setArgument(label, 2)
					setArgument(keyPath, 3)
					send(invocation, getSelector('retainArguments'))
					// Electrobun runs this code in a Bun worker, but NSApp and its Dock tile belong to the main thread, so KVC resolves both there.
					sendOnMainThread(
						invocation,
						getSelector(
							'performSelectorOnMainThread:withObject:waitUntilDone:'
						),
						getSelector('invoke'),
						null,
						false
					)
					if (label) send(label, getSelector('release'))
					send(keyPath, getSelector('release'))
				})
			),
	})
)
