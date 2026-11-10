import type { PostHogConfig } from 'posthog-js'
import type { FileRoutesByFullPath } from '@/routeTree.gen'
import { saveCookie } from '@/utils/cookie.util'

const ABSOLUTE_URL = /^https?:\/\//u
const URL_OR_PATH = /^(?:https?:\/\/|\/(?!\/))/u
// Resolves bare paths so URL can parse them; never part of a sent URL.
const PATH_ORIGIN = 'http://path.invalid'
const POSTHOG_STORAGE_KEY = /^(?:__)?ph_|^_postHogToolbarParams$/u
/** Routes whose params are user content (a label's name); the param is sent as `:name`. */
const PRIVATE_ROUTE_SEGMENTS = (
	['/app/labels/$name'] satisfies (keyof FileRoutesByFullPath)[]
).map(path => path.split('/'))

function isParam(segment: string) {
	return segment.startsWith('$')
}

/** Compares a path segment as the router sees it; a malformed escape compares as written. */
function toRouteSegment(segment: string) {
	try {
		return decodeURIComponent(segment).toLowerCase()
	} catch {
		return segment.toLowerCase()
	}
}

/** The router decodes paths and matches them case-insensitively, so `/App/%6Cabels/Work` is the label route too. */
function withoutPrivateParams(pathname: string) {
	const segments = pathname.split('/')
	const route = PRIVATE_ROUTE_SEGMENTS.find(
		routeSegments =>
			routeSegments.length <= segments.length &&
			routeSegments.every(
				(segment, index) =>
					isParam(segment) || segment === toRouteSegment(segments[index] ?? '')
			)
	)

	if (!route) return pathname

	return [
		...route.map(segment =>
			isParam(segment) ? `:${segment.slice(1)}` : segment
		),
		...segments.slice(route.length),
	].join('/')
}

/**
 * Sends `/app/labels/:name` instead of a label's name, and drops the query and hash unless `keepQuery`
 * (desktop sign-in URLs carry one-time codes and challenges there). Takes an absolute URL or a path and
 * returns the same form; anything else comes back as is.
 */
function sanitizeUrl(url: string, keepQuery = false) {
	const parsed = URL_OR_PATH.test(url) ? URL.parse(url, PATH_ORIGIN) : null

	if (!parsed) return url

	const pathname = withoutPrivateParams(parsed.pathname)

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
function sanitizeUrls(value: unknown) {
	if (typeof value !== 'object' || value === null) return

	for (const [key, entry] of Object.entries(value))
		if (
			typeof entry === 'string' &&
			(ABSOLUTE_URL.test(entry) || key.endsWith('pathname'))
		)
			Reflect.set(value, key, sanitizeUrl(entry))
		else sanitizeUrls(entry)
}

/** Removes everything posthog-js keeps on the device: its identity, session, consent, debug and toolbar keys, and the cookies an older build left. */
export function clearPostHogStorage() {
	for (const storage of [localStorage, sessionStorage])
		for (const key of Object.keys(storage))
			if (POSTHOG_STORAGE_KEY.test(key)) storage.removeItem(key)

	for (const part of document.cookie.split(';')) {
		const name = part.trim().split('=')[0] ?? ''

		if (!POSTHOG_STORAGE_KEY.test(name)) continue

		void saveCookie(name, '', 0)
		void saveCookie(name, '', 0, location.hostname)
	}
}

/**
 * Explicit events, pageviews, page leaves, exceptions and masked replay only; see docs/analytics.md.
 * With analytics denied the SDK runs cookieless: no identity, no storage, no replay.
 */
export const POSTHOG_CONFIG = {
	api_host: '/ingest',
	ui_host: 'https://eu.posthog.com',
	defaults: '2026-08-30',
	person_profiles: 'identified_only',
	// The defaults mark localhost as a test user, which turns on person processing even cookieless.
	internal_or_test_user_hostname: null,
	cookieless_mode: 'on_reject',
	opt_out_capturing_by_default: true,
	persistence: 'localStorage',
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
			name === 'href' ? sanitizeUrl(value, true) : value,
		captureJsonLd: false,
		recordHeaders: false,
		recordBody: false,
		maskCapturedNetworkRequestFn: request => ({
			...request,
			name: sanitizeUrl(request.name),
		}),
	},
	before_send: event => {
		sanitizeUrls(event)
		// `$pageview` sends the document title, which is a label's name in the label view.
		if (event?.properties) delete event.properties.title

		return event
	},
} satisfies Partial<PostHogConfig>
