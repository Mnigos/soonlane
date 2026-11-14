import { expoClient } from '@better-auth/expo/client'
import { MOBILE_APP, MOBILE_APP_HEADER } from '@soonlane/auth'
import { createAuthClient } from 'better-auth/react'
import { getItem, getItemAsync, setItem, setItemAsync } from 'expo-secure-store'
import { Platform } from 'react-native'
import {
	cancelHandOff,
	claimHandOff,
	handOffFromBrowser,
} from './android-hand-off.client'

/** The API origin; the EAS profile or `.env.local` sets it. */
export const API_URL = process.env.EXPO_PUBLIC_API_URL
/** Must equal the API's `AUTH_COOKIE_PREFIX`, or the client keeps the sign-in cookie but drops every refreshed one. */
const AUTH_COOKIE_PREFIX = process.env.EXPO_PUBLIC_AUTH_COOKIE_PREFIX
/** Where the sign-in sheet closes, on success and on error; only the sheet's own result carries the session back. */
const SIGN_IN_RETURN_URL = 'soonlane://'
/** Asks Google for a new login, as the web's fresh sign-in does; Google may still skip the password after its own risk check. */
const FORCED_GOOGLE_LOGIN_PARAMS = { prompt: 'login', max_age: '0' }
/** Trades the Android hand-off's code and verifier for a session cookie, as the desktop window does. */
const HAND_OFF_EXCHANGE_PATH = '/desktop-sign-in/exchange'
/** The requests a session end sends itself; their replies pass the boundary. */
const SESSION_END_PATHS = ['/sign-out', '/delete-user']
/** Better Auth's reply once the user is gone; with an email step configured it would answer 'Verification email sent' and delete nothing. */
const USER_DELETED = 'User deleted'
/** The deletion's identity check: never refreshes the session, so it stores nothing new on the server either. */
const SESSION_LOOKUP = 'get-session?disableRefresh=true'
/** The code a deletion ends with when the stored credential belongs to another user than the confirmation named. */
export const SESSION_CHANGED = 'SESSION_CHANGED'
/** The code a deletion ends with when the server has no session for the stored credential. */
export const NO_SESSION = 'NO_SESSION'

if (!API_URL || !AUTH_COOKIE_PREFIX)
	throw new Error(
		'Set EXPO_PUBLIC_API_URL and EXPO_PUBLIC_AUTH_COOKIE_PREFIX (see apps/mobile/.env.example).'
	)

/** Bumped when a sign-out or an account deletion starts and when it ends; a reply to a request from another epoch is dropped. */
let authEpoch = 0
/** While a sign-out or an account deletion runs, no other reply stores a session and no sign-in starts. */
let pendingSessionEnd: Promise<void> | undefined
/** The user whose `/delete-user` this app sent without getting a reply; only then does a missing session mean the deletion went through. */
let lostDeletionOf: string | undefined
/** better-fetch hands the same context object to `onRequest` and, as `request`, to `onSuccess`. */
const requestEpochs = new WeakMap<object, number>()

/** Better Auth with its Expo plugin: the session cookie lives in the Keychain under this environment's prefix. */
export const authClient = createAuthClient({
	baseURL: API_URL,
	fetchOptions: {
		plugins: [
			{
				id: 'sign-out-boundary',
				name: 'Sign-out boundary',
				hooks: {
					onRequest: context => {
						requestEpochs.set(context, authEpoch)
					},
					// Runs before the Expo plugin's success hook, so a reply a sign-out or deletion overtook never reaches the Keychain or the session.
					onSuccess: dropOvertakenReply,
				},
			},
		],
	},
	plugins: [
		expoClient({
			storage: { getItem, getItemAsync, setItem, setItemAsync },
			storagePrefix: AUTH_COOKIE_PREFIX,
			cookiePrefix: AUTH_COOKIE_PREFIX,
			webBrowserOptions: { preferEphemeralSession: true },
		}),
		{
			id: 'sign-out-boundary-after-expo',
			fetchPlugins: [
				{
					id: 'sign-out-boundary-after-expo',
					name: 'Sign-out boundary after Expo',
					// A sign-out or deletion can start while the Expo hook awaits the Keychain; checking again keeps that reply out of the session.
					hooks: { onSuccess: dropOvertakenReply },
				},
			],
		},
	],
})

/** The part of better-fetch's success context the boundary reads. */
interface AuthReply {
	request: { url: string | URL }
}

/** Throws for a reply, other than a session end's own, that a sign-out or deletion overtook; Better Auth then keeps the cleared session. */
function dropOvertakenReply({ request }: AuthReply) {
	const { pathname } = new URL(request.url)

	if (SESSION_END_PATHS.some(path => pathname.endsWith(path))) return
	if (requestEpochs.get(request) !== authEpoch || pendingSessionEnd)
		throw new Error('A sign-out or deletion overtook this request.')
}

interface GoogleSignInOptions {
	loginHint?: string
	fresh?: boolean
}

/** Opens Google once any session end has settled, in the iOS sheet or the Android hand-off; no error when the user closed or cancelled it, and a rejection with `HAND_OFF_TIMED_OUT` when Android waited too long. */
export async function signInWithGoogle({
	loginHint,
	fresh = false,
}: GoogleSignInOptions = {}) {
	if (Platform.OS === 'android') return await signInThroughBrowser(fresh)

	await sessionEndsSettled()

	return await authClient.signIn.social({
		provider: 'google',
		callbackURL: SIGN_IN_RETURN_URL,
		errorCallbackURL: SIGN_IN_RETURN_URL,
		loginHint,
		additionalParams: fresh ? FORCED_GOOGLE_LOGIN_PARAMS : undefined,
	})
}

const HAND_OFF_EXCHANGE_TIMEOUT_MS = 30_000

/** Android skips the Expo sheet, whose return any app can claim (ADR 0017, SOON-177); the attempt exists from the tap, and a sign-out or deletion before the code is claimed wins over it. */
async function signInThroughBrowser(fresh: boolean) {
	const attempt = claimHandOff()

	await sessionEndsSettled()

	const epoch = authEpoch
	const handOff = await handOffFromBrowser(attempt, fresh)

	if (!handOff || epoch !== authEpoch || pendingSessionEnd)
		return { error: null }

	const { error } = await authClient.$fetch(HAND_OFF_EXCHANGE_PATH, {
		method: 'POST',
		body: handOff,
		headers: { [MOBILE_APP_HEADER]: MOBILE_APP },
		// React Native's Android networking never times out, and Cancel is gone once the code is claimed.
		timeout: HAND_OFF_EXCHANGE_TIMEOUT_MS,
	})

	return { error }
}

/** Ends the session on the server when it can and on the phone always; a failed request leaves the server session until it expires. */
export async function signOut() {
	await endSessionWith(endThisSession)
}

/**
 * Deletes the account of `userId`, the user the confirmation named, when the
 * server finds the session fresh (ADR 0009), then signs out as `signOut` does.
 * Nothing is deleted when the stored credential belongs to someone else
 * (`signedInAs` names them, or the phone is signed out) or the server has no
 * session for it (signed out); any other failure leaves the session as it was.
 */
export async function deleteUser(userId: string) {
	const result = await endSessionWith(async () => {
		const { data, error } = await authClient.deleteUser({
			fetchOptions: { customFetchImpl: fetchDeletionOf(userId) },
		})
		const isDeleted =
			data?.message === USER_DELETED ||
			(error?.code === NO_SESSION && lostDeletionOf === userId)

		// An expired or revoked session also leaves no session, so only a lost deletion reply makes it a deletion.
		if (isDeleted || error?.code === NO_SESSION) await endThisSession()

		return { isDeleted, error: isDeleted ? null : error }
	})
	const signedInAs =
		result.error?.code === SESSION_CHANGED ? await verifiedUser() : undefined

	return { ...result, signedInAs }
}

/**
 * The user the server says the Keychain's credential belongs to, also put in
 * the session atom. Undefined when the server could not say: the phone is then
 * signed out, so no screen names one user while the Keychain holds another.
 */
export async function verifiedUser() {
	const session = await refreshSession()

	if (session) return session.user

	await signOut()

	return undefined
}

/** Asks the server whose credential the Keychain holds and puts the answer in the session atom, so the screens and the root layout's cache reset see that user; undefined when there is none or the server did not answer. */
async function refreshSession(): Promise<SessionData | undefined> {
	await readSession()?.refetch()

	const state = readSession()

	// A focus refetch can cancel this one; ask again so the answer is about the current credential.
	if (state?.isRefetching) return await refreshSession()

	return state?.error ? undefined : (state?.data ?? undefined)
}

/** The session token the Keychain holds; it changes only when a sign-in completes, unlike the sign-in's other cookies. */
export async function storedSessionToken() {
	const cookie = await authClient.getCookie()

	return cookie
		.split('; ')
		.find(entry => entry.split('=')[0]?.endsWith('.session_token'))
}

/** The session atom's state, typed as `useSession` returns it. */
type SessionState = ReturnType<typeof authClient.useSession>
/** A signed-in session as Better Auth answers it. */
type SessionData = NonNullable<SessionState['data']>

function readSession(): SessionState | undefined {
	// oxlint-disable-next-line typescript/no-unsafe-return -- Better Auth types its atoms as any; this is the one useSession reads
	return authClient.$store.atoms.session?.get()
}

/** Waits until no sign-out or deletion is pending, also one that starts while an earlier one settles. */
async function sessionEndsSettled(): Promise<void> {
	if (!pendingSessionEnd) return

	await pendingSessionEnd
	await sessionEndsSettled()
}

/** Runs `end` as one boundary: replies to requests sent before or during it are dropped, and sign-in waits until it settles. */
async function endSessionWith<T>(end: () => Promise<T>): Promise<T> {
	// Checks and claims in one step after each wait, so two waiters never both start.
	if (pendingSessionEnd) {
		await pendingSessionEnd

		return await endSessionWith(end)
	}

	authEpoch++
	cancelHandOff()

	const ending = end()
	const settled: Promise<void> = ending.then(noop, noop).finally(() => {
		authEpoch++
		if (pendingSessionEnd === settled) pendingSessionEnd = undefined
	})

	pendingSessionEnd = settled
	// The caller resumes only after the epoch bump, so its next request is not taken for an overtaken one.
	await settled

	return await ending
}

function noop() {
	return undefined
}

async function endThisSession() {
	lostDeletionOf = undefined
	await authClient.signOut({
		fetchOptions: { customFetchImpl: fetchSignOut },
	})
}

/** The part of Better Auth's `/get-session` reply the deletion check reads. */
interface SessionOwner {
	user: { id: string }
}

/**
 * Sends `/delete-user` only after `/get-session`, with the same headers and so
 * the same credential, names `userId`. That lookup bypasses the boundary's
 * guards and stores nothing; a failed lookup is the deletion's failure.
 */
function fetchDeletionOf(userId: string) {
	return async (input: RequestInfo | URL, init?: RequestInit) => {
		const lookup = await fetch(
			new URL(SESSION_LOOKUP, input instanceof Request ? input.url : input),
			{
				...init,
				method: 'GET',
				body: undefined,
			}
		)

		if (!lookup.ok) return lookup

		// oxlint-disable-next-line typescript/no-unsafe-type-assertion -- Better Auth's /get-session answers a session or null
		const session = (await lookup.json()) as SessionOwner | null

		if (!session) return jsonReply(`{"code":"${NO_SESSION}"}`, 401)
		if (session.user.id !== userId)
			return jsonReply(`{"code":"${SESSION_CHANGED}"}`, 409)

		lostDeletionOf = userId

		const reply = await fetch(input, init)

		lostDeletionOf = undefined

		return reply
	}
}

/** A failed sign-out answers as a successful one, so the Expo client still clears its copy. */
async function fetchSignOut(input: RequestInfo | URL, init?: RequestInit) {
	const response = await fetch(input, init).catch(() => undefined)

	return response?.ok ? response : jsonReply('{"success":true}', 200)
}

function jsonReply(body: string, status: number) {
	return new Response(body, {
		status,
		headers: { 'content-type': 'application/json' },
	})
}
