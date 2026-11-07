import type { CalendarDate } from '@soonlane/domain'
import { useMemo, useSyncExternalStore } from 'react'

const REACHED_TOLERANCE_PX = 4
// Without scrollend, a requested scroll settles once no scroll event came for this long.
const SCROLL_SETTLE_FALLBACK_MS = 1000
const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)'

type SectionRef = (element: HTMLElement | null) => () => void
type SortedSection = [CalendarDate, HTMLElement]

interface TrackerState {
	sortedSections?: SortedSection[]
	header?: HTMLElement | null
	activeDay: CalendarDate
	requestedDay?: CalendarDate
	frame: number
	settleTimer?: ReturnType<typeof setTimeout>
}

// The index of the last section whose top has reached the line, or -1.
function findLastReached(
	sortedSections: readonly SortedSection[],
	line: number,
	low: number,
	high: number
): number {
	if (low > high) return high

	const middle = Math.floor((low + high) / 2)
	const top = sortedSections[middle]?.[1].getBoundingClientRect().top

	return top === undefined || top > line
		? findLastReached(sortedSections, line, low, middle - 1)
		: findLastReached(sortedSections, line, middle + 1, high)
}

// While a requested scroll is in flight the requested day stays active, so the week strip does not flicker through the days it passes.
function createActiveDayTracker(firstDay: CalendarDate) {
	const sections = new Map<CalendarDate, HTMLElement>()
	const listeners = new Set<() => void>()
	const state: TrackerState = { activeDay: firstDay, frame: 0 }

	function getHeaderBottom() {
		return state.header?.getBoundingClientRect().bottom ?? 0
	}

	// The binary search needs the day sections in date order in the DOM.
	function readTopDay() {
		state.sortedSections ??= [...sections].toSorted(([a], [b]) =>
			a.localeCompare(b)
		)
		const line = getHeaderBottom() + REACHED_TOLERANCE_PX
		const index = findLastReached(
			state.sortedSections,
			line,
			0,
			state.sortedSections.length - 1
		)

		return state.sortedSections[index]?.[0] ?? firstDay
	}

	function setActiveDay(date: CalendarDate) {
		if (date === state.activeDay) return

		state.activeDay = date
		for (const listener of listeners) listener()
	}

	function hasReached(date: CalendarDate) {
		const top = sections.get(date)?.getBoundingClientRect().top

		return (
			top !== undefined &&
			Math.abs(top - getHeaderBottom()) <= REACHED_TOLERANCE_PX
		)
	}

	function update() {
		if (state.requestedDay) {
			if (hasReached(state.requestedDay)) settle()
			return
		}

		setActiveDay(readTopDay())
	}

	function scheduleUpdate() {
		if (state.frame) return

		state.frame = requestAnimationFrame(() => {
			state.frame = 0
			update()
		})
	}

	function settle() {
		clearTimeout(state.settleTimer)
		state.requestedDay = undefined
		setActiveDay(readTopDay())
	}

	function armSettleTimer() {
		clearTimeout(state.settleTimer)
		state.settleTimer = setTimeout(settle, SCROLL_SETTLE_FALLBACK_MS)
	}

	function handleScroll() {
		// A slow smooth scroll keeps re-arming the timer, so it never settles mid-way.
		if (state.requestedDay) armSettleTimer()
		scheduleUpdate()
	}

	return {
		subscribe(listener: () => void) {
			listeners.add(listener)
			window.addEventListener('scroll', handleScroll, { passive: true })
			window.addEventListener('resize', scheduleUpdate)
			window.addEventListener('scrollend', settle)
			scheduleUpdate()

			return () => {
				listeners.delete(listener)
				if (listeners.size > 0) return

				window.removeEventListener('scroll', handleScroll)
				window.removeEventListener('resize', scheduleUpdate)
				window.removeEventListener('scrollend', settle)
				cancelAnimationFrame(state.frame)
				// StrictMode resubscribes before the frame runs; a stale id would block every later update.
				state.frame = 0
				clearTimeout(state.settleTimer)
			}
		},
		getSnapshot: () => state.activeDay,
		headerRef(element: HTMLElement | null) {
			state.header = element
		},
		sectionRef(date: CalendarDate): SectionRef {
			return element => {
				if (element) sections.set(date, element)
				state.sortedSections = undefined

				return () => {
					if (sections.get(date) !== element) return

					sections.delete(date)
					state.sortedSections = undefined
				}
			}
		},
		scrollToDay(date: CalendarDate) {
			const section = sections.get(date)

			if (!section) return

			const reduceMotion = window.matchMedia(REDUCED_MOTION_QUERY).matches
			const headerHeight = state.header?.getBoundingClientRect().height ?? 0
			const top =
				section.getBoundingClientRect().top + window.scrollY - headerHeight

			state.requestedDay = date
			setActiveDay(date)
			window.scrollTo({
				top: Math.max(0, top),
				behavior: reduceMotion ? 'auto' : 'smooth',
			})
			// scrollend never fires when the page is already there, so a timer settles it too.
			armSettleTimer()
		},
	}
}

export function useActiveDay(firstDay: CalendarDate) {
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
