import { ANDROID_CALLBACK_PATH } from '@soonlane/auth'
import type { NativeIntent } from 'expo-router'

/** Better Auth's session parameter, in any spelling; the Expo client reads it only from its own sign-in sheet's result. */
const COOKIE_PATTERN = /cookie/iu

/** Undoes percent-escapes until none are left, so no later decoding step can still turn up a `cookie`. */
function decodeFully(text: string): string {
	const decoded = text.replaceAll(/%([\da-f]{2})/giu, (_, hex: string) =>
		String.fromCodePoint(Number.parseInt(hex, 16))
	)

	return decoded === text ? text : decodeFully(decoded)
}

/**
 * Keeps only the route of a link that opens the app, since Expo Router decodes
 * it again; a link that mentions a cookie anywhere opens the start screen. The
 * Android sign-in's App Link, whose code only the sign-in's own listener reads,
 * opens the start screen on a cold start and leaves an open app where it is,
 * such as Settings during the deletion's fresh sign-in.
 */
export const redirectSystemPath: NativeIntent['redirectSystemPath'] = ({
	path,
	initial,
}) => {
	const url = URL.parse(path, 'soonlane://')

	if (url?.pathname === ANDROID_CALLBACK_PATH) return initial ? '/' : ''
	if (url === null || COOKIE_PATTERN.test(decodeFully(url.href))) return '/'

	return `${url.protocol}//${url.host}${url.pathname}`
}
