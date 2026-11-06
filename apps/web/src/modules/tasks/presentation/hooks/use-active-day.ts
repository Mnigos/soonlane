import type { CalendarDate } from '@soonlist/domain'
import { useMemo, useSyncExternalStore } from 'react'

// A section counts as reached when its top is within this distance below the sticky header.
const REACHED_TOLERANCE_PX = 4
const BOTTOM_TOLERANCE_PX = 2
const SCROLL_SETTLE_FALLBACK_MS = 1000
const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)'

type SectionRef = (element: HTMLElement | null) => () => void

function isScrolledToBottom() {
	return (
		window.scrollY + window.innerHeight >=
		document.documentElement.scrollHeight - BOTTOM_TOLERANCE_PX
	)
}

/**
 * Tracks which day section sits at the top of the list, just under the sticky
 * header, and scrolls to a day. While a requested scroll is in flight the
 * requested day stays active, so the week strip does not flicker through the
 * days it passes.
 */
function createActiveDayTracker(firstDay: CalendarDate) {
	const sections = new Map<CalendarDate, HTMLElement>()
	const listeners = new Set<() => void>()
	let header: HTMLElement | null = null
	let activeDay = firstDay
	let requestedDay: CalendarDate | undefined
	let frame = 0
	let settleTimer: ReturnType<typeof setTimeout> | undefined

	function getHeaderBottom() {
		return header?.getBoundingClientRect().bottom ?? 0
	}

	function readTopDay() {
		const line = getHeaderBottom() + REACHED_TOLERANCE_PX
		let topDay = firstDay

		for (const date of [...sections.keys()].toSorted()) {
			if ((sections.get(date)?.getBoundingClientRect().top ?? 0) > line) break

			topDay = date
		}

		return topDay
	}

	function setActiveDay(date: CalendarDate) {
		if (date === activeDay) return

		activeDay = date
		for (const listener of listeners) listener()
	}

	function update() {
		if (!requestedDay) setActiveDay(readTopDay())
	}

	function scheduleUpdate() {
		if (frame) return

		frame = requestAnimationFrame(() => {
			frame = 0
			update()
		})
	}

	// The last days cannot reach the top of a short page; then the requested day stays active.
	function settle() {
		clearTimeout(settleTimer)
		const settledDay =
			requestedDay && isScrolledToBottom() ? requestedDay : readTopDay()
		requestedDay = undefined
		setActiveDay(settledDay)
	}

	return {
		subscribe(listener: () => void) {
			listeners.add(listener)
			window.addEventListener('scroll', scheduleUpdate, { passive: true })
			window.addEventListener('resize', scheduleUpdate)
			window.addEventListener('scrollend', settle)
			scheduleUpdate()

			return () => {
				listeners.delete(listener)
				if (listeners.size > 0) return

				window.removeEventListener('scroll', scheduleUpdate)
				window.removeEventListener('resize', scheduleUpdate)
				window.removeEventListener('scrollend', settle)
				cancelAnimationFrame(frame)
				clearTimeout(settleTimer)
			}
		},
		getSnapshot: () => activeDay,
		headerRef(element: HTMLElement | null) {
			header = element
		},
		sectionRef(date: CalendarDate): SectionRef {
			return element => {
				if (element) sections.set(date, element)

				return () => {
					if (sections.get(date) === element) sections.delete(date)
				}
			}
		},
		scrollToDay(date: CalendarDate) {
			const section = sections.get(date)

			if (!section) return

			const reduceMotion = window.matchMedia(REDUCED_MOTION_QUERY).matches
			const headerHeight = header?.getBoundingClientRect().height ?? 0
			const top =
				section.getBoundingClientRect().top + window.scrollY - headerHeight

			requestedDay = date
			setActiveDay(date)
			window.scrollTo({
				top: Math.max(0, top),
				behavior: reduceMotion ? 'auto' : 'smooth',
			})
			// scrollend never fires when the page is already there, so a timer settles it too.
			clearTimeout(settleTimer)
			settleTimer = setTimeout(settle, SCROLL_SETTLE_FALLBACK_MS)
		},
	}
}

/** The day at the top of the Upcoming list and a way to scroll to any rendered day. */
export function useActiveDay(firstDay: CalendarDate) {
	// One tracker per list; the page remounts when today changes.
	const tracker = useMemo(() => createActiveDayTracker(firstDay), [firstDay])
	const activeDay = useSyncExternalStore(
		tracker.subscribe,
		tracker.getSnapshot,
		tracker.getSnapshot
	)

	return {
		activeDay,
		headerRef: tracker.headerRef,
		sectionRef: tracker.sectionRef,
		scrollToDay: tracker.scrollToDay,
	}
}
