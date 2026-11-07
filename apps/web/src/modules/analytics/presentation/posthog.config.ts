import type { PostHogConfig } from 'posthog-js'
import { saveCookie } from '@/utils/cookie.util'

const ABSOLUTE_URL = /^https?:\/\//u
const POSTHOG_STORAGE_KEY = /^(?:__)?ph_|^_postHogToolbarParams$/u

// Desktop sign-in URLs carry one-time codes and challenges in the query and hash.
function withoutQuery(url: string) {
	const parsed = URL.parse(url)

	if (!parsed) return url

	parsed.search = ''
	parsed.hash = ''

	return parsed.href
}

// In place and deep: exception stack frames hold URLs too.
function stripQueries(value: unknown) {
	if (typeof value !== 'object' || value === null) return

	for (const [key, entry] of Object.entries(value))
		if (typeof entry === 'string' && ABSOLUTE_URL.test(entry))
			Reflect.set(value, key, withoutQuery(entry))
		else stripQueries(entry)
}

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
		captureJsonLd: false,
		recordHeaders: false,
		recordBody: false,
		maskCapturedNetworkRequestFn: request => ({
			...request,
			name: withoutQuery(request.name),
		}),
	},
	before_send: event => {
		stripQueries(event)

		return event
	},
} satisfies Partial<PostHogConfig>
