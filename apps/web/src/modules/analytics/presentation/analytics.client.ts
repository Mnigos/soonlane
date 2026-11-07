import type { RegisteredRouter } from '@tanstack/react-router'
import type { PostHog } from 'posthog-js'
import type {
	ConsentChoice,
	ConsentSource,
	ConsentState,
} from '@/modules/consent/domain/consent.types'
import { getConsent } from '@/modules/consent/presentation/helpers/consent-cookie.helper'
import type {
	ClientEvents,
	SuperProperties,
} from '../domain/analytics-event.types'
import { BUILD_PROPERTIES } from '../domain/analytics.constants'
import { clearPostHogStorage, POSTHOG_CONFIG } from './posthog.config'

const POSTHOG_KEY = import.meta.env.VITE_POSTHOG_KEY
// The desktop sign-in URLs carry one-time codes, so PostHog never starts, records or tracks a page there.
const DESKTOP_SIGN_IN_PREFIX = '/desktop/'

let posthogReady: Promise<PostHog | undefined> | undefined
let trackedRouter: RegisteredRouter | undefined
let trackedPath: string | undefined

function isDesktopShell() {
	return document.documentElement.dataset.shell === 'desktop'
}

function getSuperProperties(): SuperProperties {
	return {
		...BUILD_PROPERTIES,
		platform: isDesktopShell() ? 'desktop' : 'web',
		surface: 'app',
		timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
		route: trackedRouter?.state.matches.at(-1)?.routeId,
	}
}

async function startPostHog(consent: Exclude<ConsentState, 'unanswered'>) {
	if (!POSTHOG_KEY) return undefined

	try {
		const { default: posthog } = await import('posthog-js')

		// Back into the desktop sign-in while loading: its fresh document starts PostHog later, if at all.
		if (location.pathname.startsWith(DESKTOP_SIGN_IN_PREFIX)) return undefined
		if (consent !== 'granted') clearPostHogStorage()
		posthog.init(POSTHOG_KEY, POSTHOG_CONFIG)
		if (consent === 'granted')
			posthog.opt_in_capturing({ captureEventName: false })

		return posthog
	} catch {
		return undefined
	}
}

async function withPostHog(run: (posthog: PostHog) => void) {
	const posthog = await posthogReady

	if (posthog) run(posthog)
}

function registerContext(posthog: PostHog) {
	const context = trackedRouter?.state.matches.at(-1)?.context
	const user = context && 'me' in context ? context.me.user : undefined

	posthog.register(getSuperProperties())
	if (
		user &&
		posthog.has_opted_in_capturing() &&
		posthog.get_distinct_id() !== user.id
	)
		posthog.identify(user.id, { email: user.email, name: user.name })
}

function trackLocation(router: RegisteredRouter, consent: ConsentState) {
	const { pathname } = router.state.location

	if (pathname.startsWith(DESKTOP_SIGN_IN_PREFIX) || pathname === trackedPath)
		return
	if (!posthogReady) {
		if (consent === 'unanswered') return

		posthogReady = startPostHog(consent)
	}

	const isFirstPage = trackedPath === undefined

	trackedPath = pathname
	void withPostHog(posthog => {
		if (!isFirstPage) posthog.capture('$pageleave')
		registerContext(posthog)
		posthog.capture('$pageview')
		if (isFirstPage && isDesktopShell())
			posthog.capture('desktop_shell_opened', {})
		if (isFirstPage && consent === 'gpc')
			posthog.capture('consent_updated', { analytics: 'denied', source: 'gpc' })
	})
}

export function capture<TEvent extends keyof ClientEvents>(
	event: TEvent,
	properties: ClientEvents[TEvent]
) {
	void withPostHog(posthog => {
		posthog.capture(event, properties)
	})
}

export function captureException(error: unknown) {
	void withPostHog(posthog => {
		posthog.captureException(error)
	})
}

export function trackRouter(router: RegisteredRouter) {
	if (typeof window === 'undefined' || !POSTHOG_KEY) return

	trackedRouter = router
	// A running SDK cannot be unloaded, so back into the desktop sign-in after it started is a fresh document.
	router.subscribe('onBeforeNavigate', ({ toLocation }) => {
		if (
			!posthogReady ||
			!toLocation.pathname.startsWith(DESKTOP_SIGN_IN_PREFIX)
		)
			return

		void withPostHog(posthog => {
			posthog.stopSessionRecording()
		})
		window.location.assign(toLocation.href)
	})
	router.subscribe('onRendered', () => {
		trackLocation(router, getConsent())
	})
}

export function applyConsent(choice: ConsentChoice, source: ConsentSource) {
	if (!trackedRouter) return

	if (posthogReady)
		void withPostHog(posthog => {
			if (choice === 'granted')
				posthog.opt_in_capturing({ captureEventName: false })
			else {
				posthog.opt_out_capturing()
				clearPostHogStorage()
			}
			registerContext(posthog)
		})
	else trackLocation(trackedRouter, choice)
	capture('consent_updated', { analytics: choice, source })
}

export function resetAnalytics() {
	capture('user_signed_out', {})
	void withPostHog(posthog => {
		if (!posthog.has_opted_in_capturing()) return

		posthog.reset()
		posthog.opt_in_capturing({ captureEventName: false })
		posthog.register(getSuperProperties())
	})
}
