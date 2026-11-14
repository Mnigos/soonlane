import { ANDROID_SIGN_IN_PATH, DESKTOP_SIGN_IN_PATH } from '@soonlane/auth'

/** The apps a browser sign-in is handed to with a one-time code. */
export type HandOffApp = 'desktop' | 'android'

/** The pages carry a challenge or a code, which no referrer may carry to another site; `vite.config.ts` keeps them out of caches. */
export const HAND_OFF_PAGE_HEADERS = { 'Referrer-Policy': 'no-referrer' }
/** The hand-off pages' paths, in the one spelling `vite.config.ts` serves with `no-store`. */
export const HAND_OFF_PATH_PREFIXES = ['/android/', '/desktop/']

/** The page each app opens in the browser, where Google returns it after a sign-in. */
export const HAND_OFF_SIGN_IN_PATHS = {
	desktop: DESKTOP_SIGN_IN_PATH,
	android: ANDROID_SIGN_IN_PATH,
} satisfies Record<HandOffApp, string>

/** What the hand-off pages say for each app; the link text sits between `openedBeforeLink` and `openedAfterLink`. */
export const HAND_OFF_COPY = {
	desktop: {
		startHeading: 'Start from the desktop app',
		startText:
			'This page finishes a sign-in that the Soonlane desktop app started. Open the app and choose Continue with Google.',
		heading: 'Sign in to the desktop app',
		button: 'Open the desktop app',
		openedBeforeLink:
			'The desktop app finishes signing in. If it did not open, ',
		openedAfterLink: ' or check that it is in your Applications folder.',
		error: 'Could not start the desktop sign-in. Try again.',
	},
	android: {
		startHeading: 'Start from the Android app',
		startText:
			'This page finishes a sign-in that the Soonlane Android app started. Open the app and choose Continue with Google.',
		heading: 'Sign in to the Android app',
		button: 'Open the Android app',
		openedBeforeLink:
			'The Android app finishes signing in. If it did not open, ',
		openedAfterLink: '.',
		error: 'Could not start the Android sign-in. Try again.',
	},
} satisfies Record<HandOffApp, Record<string, string>>
