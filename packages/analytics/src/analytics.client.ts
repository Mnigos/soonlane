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

/** The desktop sign-in URLs carry one-time codes, so PostHog never starts, records or tracks a page there. */
const DESKTOP_SIGN_IN_PREFIX = '/desktop/'
const SITE_LAYOUT_ROUTE_ID = '/_site'
const BLOG_ROUTE_ID_PREFIX = '/_site/blog'

interface AnalyticsUser {
	id: string
	email: string
	name: string
}

export interface BrowserAnalyticsOptions<TRouter extends AnyRouter> {
	/** The PostHog project key; without one nothing is loaded or sent. */
	key: string | undefined
	buildProperties: Pick<
		SuperProperties,
		'app_version' | 'commit' | 'environment'
	>
	/** Route paths (`/app/labels/$name`) whose params are user content or a secret, sent as `:name`. */
	privateRoutes: readonly string[]
	/** The signed-in user on the current page, identified when analytics is granted. */
	getUser?: (router: TRouter) => AnalyticsUser | undefined
}

interface Tracking {
	router: AnyRouter
	key: string
	buildProperties: BrowserAnalyticsOptions<AnyRouter>['buildProperties']
	privateRoutes: readonly string[]
	getUser: () => AnalyticsUser | undefined
}

let posthogReady: Promise<PostHog | undefined> | undefined
let tracking: Tracking | undefined
let trackedPath: string | undefined

function isDesktopShell() {
	return document.documentElement.dataset.shell === 'desktop'
}

/** The blog's pages share the public site's layout but count as their own surface. */
function getSurface(routeIds: string[]): SuperProperties['surface'] {
	if (routeIds.at(-1)?.startsWith(BLOG_ROUTE_ID_PREFIX)) return 'blog'

	return routeIds.includes(SITE_LAYOUT_ROUTE_ID) ? 'landing' : 'app'
}

function getSuperProperties({
	router,
	buildProperties,
}: Tracking): SuperProperties {
	const routeIds = router.state.matches.map(
		({ routeId }: { routeId: string }) => routeId
	)

	return {
		...buildProperties,
		platform: isDesktopShell() ? 'desktop' : 'web',
		surface: getSurface(routeIds),
		timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
		route: routeIds.at(-1),
	}
}

async function startPostHog(
	{ key, privateRoutes }: Tracking,
	consent: Exclude<ConsentState, 'unanswered'>
) {
	try {
		const { default: posthog } = await import('posthog-js')

		// Back into the desktop sign-in while loading: its fresh document starts PostHog later, if at all.
		if (location.pathname.startsWith(DESKTOP_SIGN_IN_PREFIX)) return undefined
		if (consent !== 'granted') clearPostHogStorage()
		posthog.init(key, createPostHogConfig(privateRoutes))
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

function registerContext(
	posthog: PostHog,
	{ getUser }: Tracking,
	properties: SuperProperties
) {
	const user = getUser()

	posthog.register(properties)
	if (
		user &&
		posthog.has_opted_in_capturing() &&
		posthog.get_distinct_id() !== user.id
	)
		posthog.identify(user.id, { email: user.email, name: user.name })
}

function trackLocation(current: Tracking, consent: ConsentState) {
	const { pathname } = current.router.state.location

	if (pathname.startsWith(DESKTOP_SIGN_IN_PREFIX) || pathname === trackedPath)
		return
	if (!posthogReady) {
		if (consent === 'unanswered') return

		posthogReady = startPostHog(current, consent)
	}

	const isFirstPage = trackedPath === undefined
	// Read now: pages rendered while posthog-js still loads are captured later, after the router has moved on.
	const properties = getSuperProperties(current)

	trackedPath = pathname
	void withPostHog(posthog => {
		if (!isFirstPage) posthog.capture('$pageleave')
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
		posthog.capture(event, properties)
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
		buildProperties,
		privateRoutes,
		getUser,
	}: BrowserAnalyticsOptions<TRouter>
) {
	if (typeof window === 'undefined' || !key) return

	const current: Tracking = {
		router,
		key,
		buildProperties,
		privateRoutes,
		getUser: () => getUser?.(router),
	}

	tracking = current
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
		trackLocation(current, readStoredConsent())
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
				clearPostHogStorage()
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
		if (!posthog.has_opted_in_capturing()) return

		posthog.reset()
		posthog.opt_in_capturing({ captureEventName: false })
		posthog.register(getSuperProperties(current))
	})
}
