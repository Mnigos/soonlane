import type { PostHogConfig } from 'posthog-js'
import { getSharedCookieDomains } from './consent.helper'
import { saveCookie } from './utils/cookie.util'

const ABSOLUTE_URL = /^https?:\/\//u
const URL_OR_PATH = /^(?:https?:\/\/|\/(?!\/))/u
/** Resolves bare paths so URL can parse them; never part of a sent URL. */
const PATH_ORIGIN = 'http://path.invalid'
const POSTHOG_STORAGE_KEY = /^(?:__)?ph_|^_postHogToolbarParams$/u
/** `$name` or `{$name}.ext` in a route path. */
const ROUTE_PARAM = /^\{?\$(\w+)/u
/** A private route's path split into segments. */
type RouteSegments = string[]

function paramName(segment: string) {
	return ROUTE_PARAM.exec(segment)?.[1]
}

/** Compares a path segment as the router sees it; a malformed escape compares as written. */
function toRouteSegment(segment: string) {
	try {
		return decodeURIComponent(segment).toLowerCase()
	} catch {
		return segment.toLowerCase()
	}
}

/** The router decodes paths and matches them case-insensitively, so `/%4Cabels/Work` is the label route too. */
function withoutPrivateParams(
	privateRoutes: readonly RouteSegments[],
	pathname: string
) {
	const segments = pathname.split('/')
	const route = privateRoutes.find(
		routeSegments =>
			routeSegments.length <= segments.length &&
			routeSegments.every(
				(segment, index) =>
					paramName(segment) !== undefined ||
					segment === toRouteSegment(segments[index] ?? '')
			)
	)

	if (!route) return pathname

	return [
		...route.map(segment => {
			const name = paramName(segment)

			return name === undefined ? segment : `:${name}`
		}),
		...segments.slice(route.length),
	].join('/')
}

/**
 * Sends `/labels/:name` instead of a label's name and `/calendar/:token` instead of a calendar link, and drops the query and hash unless `keepQuery`
 * (desktop sign-in URLs carry one-time codes and challenges there). Takes an absolute URL or a path and
 * returns the same form; anything else comes back as is.
 */
function sanitizeUrl(
	privateRoutes: readonly RouteSegments[],
	url: string,
	keepQuery = false
) {
	const parsed = URL_OR_PATH.test(url) ? URL.parse(url, PATH_ORIGIN) : null

	if (!parsed) return url

	const pathname = withoutPrivateParams(privateRoutes, parsed.pathname)

	if (keepQuery && pathname === parsed.pathname) return url

	parsed.pathname = pathname
	if (!keepQuery) {
		parsed.search = ''
		parsed.hash = ''
	}

	return parsed.origin === PATH_ORIGIN
		? parsed.href.slice(PATH_ORIGIN.length)
		: parsed.href
}

/** In place and deep: exception stack frames hold URLs too, and `$pathname`-like keys hold bare paths. */
function sanitizeUrls(privateRoutes: readonly RouteSegments[], value: unknown) {
	if (typeof value !== 'object' || value === null) return

	for (const [key, entry] of Object.entries(value))
		if (
			typeof entry === 'string' &&
			(ABSOLUTE_URL.test(entry) || key.endsWith('pathname'))
		)
			Reflect.set(value, key, sanitizeUrl(privateRoutes, entry))
		else sanitizeUrls(privateRoutes, entry)
}

/**
 * Removes what posthog-js keeps on the device for this environment: every key in this host's storage, older builds'
 * included, and the environment's cookies, also those on the domain its hosts share. Another environment's
 * cookies on that domain stay. Resolves once the browser has deleted them, so the SDK started next cannot read a stale consent record.
 */
export async function clearPostHogStorage(cookiePrefix: string) {
	for (const storage of [localStorage, sessionStorage])
		for (const key of Object.keys(storage))
			if (POSTHOG_STORAGE_KEY.test(key)) storage.removeItem(key)

	const names = document.cookie
		.split(';')
		.map(part => part.trim().split('=')[0] ?? '')
		.filter(name => name.startsWith(`ph_${cookiePrefix}_`))
	const domains = [
		undefined,
		location.hostname,
		...getSharedCookieDomains(location.hostname),
	]

	await Promise.allSettled(
		names.flatMap(name =>
			domains.map(async domain => await saveCookie(name, '', 0, domain))
		)
	)
}

/**
 * Explicit events, pageviews, page leaves, exceptions and masked replay only, sent through the proxy at `apiHost`;
 * see docs/analytics.md. With analytics denied the SDK runs cookieless: no identity, no storage, no replay. `privateRoutes`
 * lists the route paths (`/labels/$name`) whose params every sent URL replaces with `:name`. Every cookie the
 * SDK keeps is named `ph_<cookiePrefix>_…`, since production's cookies for `soonlane.com` reach staging hosts too.
 */
export function createPostHogConfig(
	apiHost: string,
	privateRoutes: readonly string[],
	cookiePrefix: string
): Partial<PostHogConfig> {
	const routeSegments = privateRoutes.map(path => path.split('/'))

	return {
		api_host: apiHost,
		ui_host: 'https://eu.posthog.com',
		defaults: '2026-08-30',
		person_profiles: 'identified_only',
		// The defaults mark localhost as a test user, which turns on person processing even cookieless.
		internal_or_test_user_hostname: null,
		cookieless_mode: 'on_reject',
		opt_out_capturing_by_default: true,
		// The identity and the SDK's consent record sit on the domain both hosts share; a host without the record starts opted out and drops the identity.
		persistence: 'localStorage+cookie',
		persistence_name: `${cookiePrefix}_posthog`,
		opt_out_capturing_persistence_type: 'cookie',
		consent_persistence_name: `ph_${cookiePrefix}_consent`,
		cross_subdomain_cookie: true,
		advanced_disable_feature_flags: true,
		disable_surveys: true,
		disable_product_tours: true,
		disable_conversations: true,
		capture_pageview: false,
		capture_pageleave: true,
		autocapture: false,
		rageclick: false,
		capture_dead_clicks: false,
		capture_heatmaps: false,
		capture_exceptions: {
			capture_unhandled_errors: true,
			capture_unhandled_rejections: true,
			capture_console_errors: false,
		},
		enable_recording_console_log: false,
		session_recording: {
			maskAllInputs: true,
			// The label view's document title is the label's name.
			maskTextSelector: 'title',
			// Links to a label view carry its name in the path.
			maskAttributeFn: (name, value) =>
				name === 'href' ? sanitizeUrl(routeSegments, value, true) : value,
			captureJsonLd: false,
			recordHeaders: false,
			recordBody: false,
			maskCapturedNetworkRequestFn: request => ({
				...request,
				name: sanitizeUrl(routeSegments, request.name),
			}),
		},
		before_send: event => {
			sanitizeUrls(routeSegments, event)
			// `$pageview` sends the document title, which is a label's name in the label view.
			if (event?.properties) delete event.properties.title

			return event
		},
	}
}
