import { SIGNED_IN_HINT_COOKIE } from '@soonlane/auth'
import { useSyncExternalStore } from 'react'

// Cookies have no change event; another tab's sign-in shows once this tab is visible again.
function subscribe(onChange: () => void) {
	document.addEventListener('visibilitychange', onChange)

	return () => document.removeEventListener('visibilitychange', onChange)
}

function hasSignedInHint() {
	return document.cookie.split('; ').includes(`${SIGNED_IN_HINT_COOKIE}=1`)
}

const getServerSnapshot = () => false

export function useSignedInHint() {
	return useSyncExternalStore(subscribe, hasSignedInHint, getServerSnapshot)
}
