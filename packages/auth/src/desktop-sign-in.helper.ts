const VERIFIER_BYTES = 32

function toBase64Url(bytes: Uint8Array) {
	return btoa(String.fromCodePoint(...bytes))
		.replaceAll('+', '-')
		.replaceAll('/', '_')
		.replace(/=+$/u, '')
}

/** The secret the desktop app keeps while the user signs in in the browser (PKCE code verifier). */
export function createCodeVerifier() {
	return toBase64Url(crypto.getRandomValues(new Uint8Array(VERIFIER_BYTES)))
}

/** Base64url SHA-256 (PKCE S256), also the stored form of a sign-in code. */
export async function toCodeChallenge(value: string) {
	const digest = await crypto.subtle.digest(
		'SHA-256',
		new TextEncoder().encode(value)
	)

	return toBase64Url(new Uint8Array(digest))
}
