import type { AnyRouter } from '@tanstack/react-router'
import type { PostHog } from 'posthog-js'
import type { ClientEvents, SuperProperties } from './analytics-event.types'
import { readStoredConsent } from './consent-cookie.helper'
import type {
	ConsentChoice,
	ConsentSource,
	ConsentState,
} from './consent.types'
import { clearPostHogStorage, createPostHogConfig } from './posthog.config'
import { toSnakeCaseKeys } from './utils/snake-case-keys.util'

/** The desktop and Android sign-in URLs carry one-time codes and challenges, so PostHog never starts, records or tracks a page there. */
const HAND_OFF_PREFIXES = ['/desktop/', '/android/']

interface AnalyticsUser {
	id: string
	email: string
	name: string
}

export interface BrowserAnalyticsOptions<TRouter extends AnyRouter> {
	/** The PostHog project key; without one nothing is loaded or sent. */
	key: string | undefined
	/** The PostHog proxy on the API host (`<API origin>/ingest`). */
	apiHost: string
	buildProperties: Pick<
		SuperProperties,
		'appVersion' | 'commit' | 'environment'
	>
	/** Route paths (`/labels/$name`) whose params are user content or a secret, sent as `:name`. */
	privateRoutes: readonly string[]
	/** The environment's cookie prefix, which names the consent cookie and PostHog's cookies. */
	cookiePrefix: string
	/** The signed-in user on the current page, identified when analytics is granted; `null` when the page knows nobody is signed in, which drops an identity left from an account (deleted elsewhere, or signed in from another tab) so its events stop reaching that account's person. */
	getUser?: (router: TRouter) => AnalyticsUser | null | undefined
	/** The part of the product the page with this route id belongs to. */
	getSurface: (routeId: string | undefined) => SuperProperties['surface']
}

/** `AnyRouter` types its matches as `any`; annotating the one field read keeps the route id typed. */
interface RouteMatch {
	routeId: string
}

interface Tracking {
	router: AnyRouter
	key: string
	apiHost: string
	buildProperties: BrowserAnalyticsOptions<AnyRouter>['buildProperties']
	privateRoutes: readonly string[]
	cookiePrefix: string
	getUser: () => AnalyticsUser | null | undefined
	getSurface: BrowserAnalyticsOptions<AnyRouter>['getSurface']
}

let posthogReady: Promise<PostHog | undefined> | undefined
let tracking: Tracking | undefined
let trackedPath: string | undefined

/** The router matches paths case-insensitively, so `/Android/callback` is a hand-off page too. */
function isHandOffPath(pathname: string) {
	return HAND_OFF_PREFIXES.some(prefix =>
		pathname.toLowerCase().startsWith(prefix)
	)
}

function isDesktopShell() {
	return document.documentElement.dataset.shell === 'desktop'
}

function getSuperProperties({
	router,
	buildProperties,
	getSurface,
}: Tracking): SuperProperties {
	const route = router.state.matches
		.map(({ routeId }: RouteMatch) => routeId)
		.at(-1)

	return {
		...buildProperties,
		platform: isDesktopShell() ? 'desktop' : 'web',
		surface: getSurface(route),
		timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
		route,
	}
}

async function startPostHog(
	{ key, apiHost, privateRoutes, cookiePrefix }: Tracking,
	consent: Exclude<ConsentState, 'unanswered'>
) {
	try {
		const { default: posthog } = await import('posthog-js')

		if (consent !== 'granted') await clearPostHogStorage(cookiePrefix)
		// Back into a hand-off page while loading: its fresh document starts PostHog later, if at all.
		if (isHandOffPath(location.pathname)) return undefined
		posthog.init(key, createPostHogConfig(apiHost, privateRoutes, cookiePrefix))
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

/** `reset()` also clears the SDK's stored consent and super properties, so both come back. */
function startAnonymous(posthog: PostHog, properties: SuperProperties) {
	posthog.reset()
	posthog.opt_in_capturing({ captureEventName: false })
	posthog.register(toSnakeCaseKeys(properties))
}

/** Starts anonymous when the page knows nobody is signed in but the SDK still holds an identified user; true when it did. */
function forgetSignedOutUser(
	posthog: PostHog,
	{ getUser }: Tracking,
	properties: SuperProperties
) {
	const isStale =
		getUser() === null &&
		posthog.has_opted_in_capturing() &&
		posthog._isIdentified()

	if (isStale) startAnonymous(posthog, properties)

	return isStale
}

function registerContext(
	posthog: PostHog,
	current: Tracking,
	properties: SuperProperties
) {
	if (forgetSignedOutUser(posthog, current, properties)) return

	const user = current.getUser()

	posthog.register(toSnakeCaseKeys(properties))
	if (
		user &&
		posthog.has_opted_in_capturing() &&
		posthog.get_distinct_id() !== user.id
	)
		posthog.identify(user.id, { email: user.email, name: user.name })
}

function trackLocation(current: Tracking, consent: ConsentState) {
	const { pathname } = current.router.state.location

	if (isHandOffPath(pathname) || pathname === trackedPath) return
	if (!posthogReady) {
		if (consent === 'unanswered') return

		posthogReady = startPostHog(current, consent)
	}

	const isFirstPage = trackedPath === undefined
	// Read now: pages rendered while posthog-js still loads are captured later, after the router has moved on.
	const properties = getSuperProperties(current)

	trackedPath = pathname
	void withPostHog(posthog => {
		// The page left belonged to the forgotten user, so no `$pageleave` goes out under the new id.
		const isForgotten = forgetSignedOutUser(posthog, current, properties)

		if (!(isFirstPage || isForgotten)) posthog.capture('$pageleave')
		registerContext(posthog, current, properties)
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
		posthog.capture(event, toSnakeCaseKeys(properties))
	})
}

export function captureException(error: unknown) {
	void withPostHog(posthog => {
		posthog.captureException(error)
	})
}

/** Starts page tracking for the app's router; PostHog loads at the first page with an answer. */
export function trackRouter<TRouter extends AnyRouter>(
	router: TRouter,
	{
		key,
		apiHost,
		buildProperties,
		privateRoutes,
		cookiePrefix,
		getUser,
		getSurface,
	}: BrowserAnalyticsOptions<TRouter>
) {
	if (typeof window === 'undefined' || !key) return

	const current: Tracking = {
		router,
		key,
		apiHost,
		buildProperties,
		privateRoutes,
		cookiePrefix,
		getUser: () => getUser?.(router),
		getSurface,
	}

	tracking = current
	// A running SDK cannot be unloaded, so back into a hand-off page after it started is a fresh document.
	router.subscribe('onBeforeNavigate', ({ toLocation }) => {
		if (!posthogReady || !isHandOffPath(toLocation.pathname)) return

		void withPostHog(posthog => {
			posthog.stopSessionRecording()
		})
		window.location.assign(toLocation.href)
	})
	router.subscribe('onRendered', () => {
		trackLocation(current, readStoredConsent(current.cookiePrefix))
	})
}

/** Applies a new answer without a reload: full PostHog on a grant, cookieless with nothing stored on a denial. */
export function applyConsent(choice: ConsentChoice, source: ConsentSource) {
	const current = tracking

	if (!current) return

	if (posthogReady)
		void withPostHog(posthog => {
			if (choice === 'granted')
				posthog.opt_in_capturing({ captureEventName: false })
			else {
				posthog.opt_out_capturing()
				void clearPostHogStorage(current.cookiePrefix)
			}
			registerContext(posthog, current, getSuperProperties(current))
		})
	else trackLocation(current, choice)
	capture('consent_updated', { analytics: choice, source })
}

export function resetAnalytics() {
	const current = tracking

	if (!current) return

	void withPostHog(posthog => {
		if (posthog.has_opted_in_capturing())
			startAnonymous(posthog, getSuperProperties(current))
	})
}
