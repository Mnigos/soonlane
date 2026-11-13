import {
	type AppEnvironment,
	type ClientEvents,
	type ConsentChoice,
	type ConsentSource,
	type SuperProperties,
	toSnakeCaseKeys,
} from '@soonlane/analytics'
import Constants from 'expo-constants'
import { getItem, setItem } from 'expo-secure-store'
import { PostHog, type PostHogOptions } from 'posthog-react-native'

/** A public project key, like the web's; a build without one asks nothing and sends nothing. */
const POSTHOG_KEY = process.env.EXPO_PUBLIC_POSTHOG_KEY
const CONSENT_KEY = 'analytics-consent'
const ENVIRONMENT = (
	['production', 'staging', 'development'] satisfies AppEnvironment[]
).find(environment => environment === process.env.EXPO_PUBLIC_APP_ENV)
/**
 * Only the events `capture` hands over, to the EU host. The SDK keeps nothing
 * on the phone, never reads the launch URL (only its lifecycle events do) and
 * loads no flags, surveys, replay or error autocapture (docs/analytics.md).
 */
const POSTHOG_OPTIONS = {
	host: 'https://eu.i.posthog.com',
	persistence: 'memory',
	personProfiles: 'identified_only',
	captureAppLifecycleEvents: false,
	enableSessionReplay: false,
	errorTracking: { autocapture: false },
	disableSurveys: true,
	preloadFeatureFlags: false,
	disableRemoteFeatureFlags: true,
	setDefaultPersonProperties: false,
} satisfies PostHogOptions

type EventProperties = NonNullable<Parameters<PostHog['capture']>[1]>

export const IS_ANALYTICS_ENABLED = Boolean(POSTHOG_KEY)

let consent = readStoredConsent()
let posthog: PostHog | undefined
let signedInUserId: string | undefined

function readStoredConsent() {
	const stored = getItem(CONSENT_KEY)

	return stored === 'granted' || stored === 'denied' ? stored : 'unanswered'
}

/** The events' properties are ids, enums, counts and booleans; an absent optional one is `undefined`, which JSON drops, and the SDK's type does not allow. */
function toWireProperties(properties: object) {
	// oxlint-disable-next-line typescript/no-unsafe-type-assertion -- see the JSDoc
	return toSnakeCaseKeys(properties) as EventProperties
}

function registerSuperProperties(client: PostHog) {
	void client.register(
		toWireProperties({
			appVersion: Constants.expoConfig?.version,
			environment: ENVIRONMENT,
			platform: 'ios',
			surface: 'app',
			timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
		} satisfies Partial<SuperProperties>)
	)
}

function syncIdentity() {
	if (consent !== 'granted' || posthog?.getDistinctId() === signedInUserId)
		return
	// Distinct and anonymous ids differ only while a user is identified.
	if (posthog && posthog.getDistinctId() !== posthog.getAnonymousId()) {
		posthog.reset()
		registerSuperProperties(posthog)
	}
	if (signedInUserId) posthog?.identify(signedInUserId)
}

function startPostHog(key: string) {
	posthog ??= new PostHog(key, POSTHOG_OPTIONS)
	void posthog.optIn()
	registerSuperProperties(posthog)
	syncIdentity()
}

export function readAnalyticsConsent() {
	return consent
}

export function capture<TEvent extends keyof ClientEvents>(
	event: TEvent,
	properties: ClientEvents[TEvent]
) {
	posthog?.capture(event, toWireProperties(properties))
}

/** Follows the session: `userId` is the only thing about the user PostHog ever gets (apps/mobile/AGENTS.md). */
export function followUser(userId: string | undefined) {
	signedInUserId = userId
	syncIdentity()
}

/** Stores the answer and starts the SDK on a grant; a denial sends `consent_updated` only from a running SDK, then stops it. */
export function applyConsent(choice: ConsentChoice, source: ConsentSource) {
	if (!POSTHOG_KEY) return

	setItem(CONSENT_KEY, choice)
	consent = choice
	if (choice === 'granted') startPostHog(POSTHOG_KEY)
	capture('consent_updated', { analytics: choice, source })
	if (choice === 'denied') {
		void posthog?.optOut()
		// An opt-out stops new events only; this sends the denial already queued.
		void posthog?.flush()
	}
}

if (POSTHOG_KEY && consent === 'granted') startPostHog(POSTHOG_KEY)
