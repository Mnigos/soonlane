import {
	ANDROID_CALLBACK_PATH,
	ANDROID_SIGN_IN_PATH,
	CODE_CHALLENGE_PARAM,
	FRESH_SIGN_IN_PARAM,
	SIGN_IN_CODE_PARAM,
	SIGN_IN_CODE_PATTERN,
	toBase64Url,
} from '@soonlane/auth'
import {
	CryptoDigestAlgorithm,
	CryptoEncoding,
	digestStringAsync,
	getRandomBytesAsync,
} from 'expo-crypto'
import { openBrowserAsync } from 'expo-web-browser'
import { Linking } from 'react-native'

/** The web app's origin, whose `assetlinks.json` verifies this build; the EAS profile or `.env.local` sets it. */
const WEB_ORIGIN = URL.parse(process.env.EXPO_PUBLIC_WEB_URL ?? '')?.origin
/** Covers Google's sign-in with a second factor and the click; the code itself still expires two minutes after it is minted. */
const HAND_OFF_TIMEOUT_MS = 10 * 60 * 1000
const VERIFIER_BYTES = 32
/** The message a hand-off that waited the whole timeout rejects with. */
export const HAND_OFF_TIMED_OUT = 'HAND_OFF_TIMED_OUT'

/** One sign-in's hand-off; `stop` ends its wait once the link listener is in place. */
export interface HandOffAttempt {
	webOrigin: string
	stop?: () => void
}

const listeners = new Set<() => void>()

/** The attempt Cancel, a newer start or a session end ends: set from the start until a code, a timeout or a cancel ends it. */
let liveAttempt: HandOffAttempt | undefined

function setLiveAttempt(attempt: HandOffAttempt | undefined) {
	liveAttempt = attempt
	for (const listener of listeners) listener()
}

/** Ends the live attempt at any step, also before its tab opens; a claimed code's exchange is no longer an attempt. */
export function cancelHandOff() {
	const attempt = liveAttempt

	if (!attempt) return

	setLiveAttempt(undefined)
	attempt.stop?.()
}

/** Starts an attempt before any await, ending an older one, so Cancel and a session end reach it from the first tap. */
export function claimHandOff(): HandOffAttempt {
	if (!WEB_ORIGIN)
		throw new Error('Set EXPO_PUBLIC_WEB_URL (see apps/mobile/.env.example).')

	cancelHandOff()

	const attempt = { webOrigin: WEB_ORIGIN }

	setLiveAttempt(attempt)

	return attempt
}

/** Whether Cancel still ends the sign-in: false once a code is claimed and the exchange runs. */
export function isHandOffCancellable() {
	return liveAttempt !== undefined
}

export function subscribeToHandOff(onChange: () => void) {
	listeners.add(onChange)

	return () => {
		listeners.delete(onChange)
	}
}

/** Resolves with the App Link's code and this attempt's verifier, or undefined once the attempt ended; rejects on timeout. The verifier lives only in memory. */
export async function handOffFromBrowser(
	attempt: HandOffAttempt,
	fresh: boolean
) {
	const verifier = toBase64Url(await getRandomBytesAsync(VERIFIER_BYTES))
	const challenge = toBase64Url(
		base64ToBytes(
			await digestStringAsync(CryptoDigestAlgorithm.SHA256, verifier, {
				encoding: CryptoEncoding.BASE64,
			})
		)
	)

	if (liveAttempt !== attempt) return undefined

	const url = new URL(ANDROID_SIGN_IN_PATH, attempt.webOrigin)

	url.searchParams.set(CODE_CHALLENGE_PARAM, challenge)
	if (fresh) url.searchParams.set(FRESH_SIGN_IN_PARAM, 'true')

	const code = waitForCode(attempt)

	try {
		// In the app's task, so the App Link that brings the app back closes the tab.
		await openBrowserAsync(url.href, { createTask: false })
	} catch (error) {
		attempt.stop?.()
		throw error
	}

	const handedOff = await code

	return handedOff ? { code: handedOff, verifier } : undefined
}

/** The first valid link claims the attempt, so a repeated one starts no second exchange. */
async function waitForCode(attempt: HandOffAttempt) {
	// oxlint-disable-next-line promise/avoid-new -- a Linking event, a timer and a cancel settle it; no library call returns that promise
	return await new Promise<string | undefined>((resolve, reject) => {
		const subscription = Linking.addEventListener('url', ({ url }) => {
			const code = readCallbackCode(url, attempt.webOrigin)

			if (code) end(() => resolve(code))
		})
		const timer = setTimeout(
			() => end(() => reject(new Error(HAND_OFF_TIMED_OUT))),
			HAND_OFF_TIMEOUT_MS
		)

		function end(settle: () => void) {
			subscription.remove()
			clearTimeout(timer)
			attempt.stop = undefined
			if (liveAttempt === attempt) setLiveAttempt(undefined)
			settle()
		}

		attempt.stop = () => end(() => resolve(undefined))
	})
}

/** Any app can send this link, so it must be this build's origin, the exact path and one well-formed `code`, nothing else. */
function readCallbackCode(link: string, webOrigin: string) {
	const url = URL.parse(link)

	if (
		url?.origin !== webOrigin ||
		url.pathname !== ANDROID_CALLBACK_PATH ||
		url.username ||
		url.password ||
		url.hash
	)
		return undefined

	const params = [...url.searchParams]
	const [name, code] = params[0] ?? []

	return params.length === 1 &&
		name === SIGN_IN_CODE_PARAM &&
		code !== undefined &&
		SIGN_IN_CODE_PATTERN.test(code)
		? code
		: undefined
}

function base64ToBytes(base64: string) {
	return Uint8Array.from(
		atob(base64),
		character => character.codePointAt(0) ?? 0
	)
}
