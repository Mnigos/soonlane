import { expoClient } from '@better-auth/expo/client'
import { createAuthClient } from 'better-auth/react'
import { getItem, getItemAsync, setItem, setItemAsync } from 'expo-secure-store'

/** The API origin; the EAS profile or `.env.local` sets it. */
export const API_URL = process.env.EXPO_PUBLIC_API_URL
/** Must equal the API's `AUTH_COOKIE_PREFIX`, or the client keeps the sign-in cookie but drops every refreshed one. */
const AUTH_COOKIE_PREFIX = process.env.EXPO_PUBLIC_AUTH_COOKIE_PREFIX
/** Where the sign-in sheet closes, on success and on error; only the sheet's own result carries the session back. */
const SIGN_IN_RETURN_URL = 'soonlane://'

if (!API_URL || !AUTH_COOKIE_PREFIX)
	throw new Error(
		'Set EXPO_PUBLIC_API_URL and EXPO_PUBLIC_AUTH_COOKIE_PREFIX (see apps/mobile/.env.example).'
	)

/** Bumped when a sign-out starts and when it ends; a reply to a request from another epoch is dropped. */
let authEpoch = 0
/** While a sign-out runs, no reply stores a session and no sign-in starts. */
let pendingSignOut: Promise<void> | undefined
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
					// Runs before the Expo plugin's success hook, so a reply a sign-out overtook never reaches the Keychain or the session.
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
					// A sign-out can start while the Expo hook awaits the Keychain; checking again keeps that reply out of the session.
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

/** Throws for a reply, other than the sign-out's own, that a sign-out overtook; Better Auth then keeps the cleared session. */
function dropOvertakenReply({ request }: AuthReply) {
	if (new URL(request.url).pathname.endsWith('/sign-out')) return
	if (requestEpochs.get(request) !== authEpoch || pendingSignOut)
		throw new Error('A sign-out overtook this request.')
}

/** Opens Google in the system sign-in sheet once any sign-out has settled; resolves once the sheet closes. */
export async function signInWithGoogle() {
	await pendingSignOut

	return await authClient.signIn.social({
		provider: 'google',
		callbackURL: SIGN_IN_RETURN_URL,
		errorCallbackURL: SIGN_IN_RETURN_URL,
	})
}

/** Ends the session on the server when it can and on the phone always; a failed request leaves the server session until it expires. */
export async function signOut() {
	pendingSignOut ??= endSession()

	await pendingSignOut
}

async function endSession() {
	authEpoch++

	try {
		await authClient.signOut({
			fetchOptions: { customFetchImpl: fetchSignOut },
		})
	} finally {
		authEpoch++
		pendingSignOut = undefined
	}
}

/** A failed sign-out answers as a successful one, so the Expo client still clears its copy. */
async function fetchSignOut(input: RequestInfo | URL, init?: RequestInit) {
	const response = await fetch(input, init).catch(() => undefined)

	return response?.ok
		? response
		: new Response('{"success":true}', {
				headers: { 'content-type': 'application/json' },
			})
}
