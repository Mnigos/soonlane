import type { LocationRewrite } from '@tanstack/react-router'
import {
	APP_ORIGIN,
	SHARED_PATHS,
	SITE_ORIGIN,
	SITE_PREFIX,
} from '../hosting.constants'

const APP_HOST = new URL(APP_ORIGIN).host
const ESCAPE = /%[\da-f]{2}/giu

function decodeEscape(escape: string) {
	try {
		return decodeURI(escape)
	} catch {
		return escape
	}
}

/** Compared decoded escape by escape (a malformed one stays as written) and case-insensitively, so `/%73ite` is `/site` as it is to the router. */
function isUnder(pathname: string, prefix: string) {
	const path = pathname.replaceAll(ESCAPE, decodeEscape).toLowerCase()

	return path === prefix || path.startsWith(`${prefix}/`)
}

function isShared(pathname: string) {
	return SHARED_PATHS.some(path => isUnder(pathname, path))
}

function moveTo(origin: string, { pathname, search, hash }: URL) {
	return new URL(`${pathname}${search}${hash}`, origin)
}

export function isAppHost(url: URL) {
	return url.host === APP_HOST
}

/**
 * Every host but the app's adds `SITE_PREFIX`; on the app host a path already under it gets it twice and matches nothing.
 * Links to the other host's pages become absolute URLs on its origin. Input and output stay exact inverses, or the canonical redirect loops.
 */
export const hostRewrite: LocationRewrite = {
	input: ({ url }) => {
		if (
			!isShared(url.pathname) &&
			(!isAppHost(url) || isUnder(url.pathname, SITE_PREFIX))
		)
			url.pathname = `${SITE_PREFIX}${url.pathname}`

		return url
	},
	output: ({ url }) => {
		if (!isUnder(url.pathname, SITE_PREFIX))
			return isAppHost(url) || isShared(url.pathname)
				? url
				: moveTo(APP_ORIGIN, url)

		url.pathname = url.pathname.slice(SITE_PREFIX.length) || '/'

		return isAppHost(url) && !isUnder(url.pathname, SITE_PREFIX)
			? moveTo(SITE_ORIGIN, url)
			: url
	},
}
