import { toCalendarDate } from '@soonlist/domain'
import {
	createMemoryHistory,
	createRootRoute,
	createRouter,
	RouterProvider,
} from '@tanstack/react-router'
import { load } from 'cheerio'
import { renderToStaticMarkup } from 'react-dom/server'
import { UpcomingPage } from './upcoming-page'

const today = toCalendarDate('2026-11-05')

async function renderPage(week?: string) {
	const rootRoute = createRootRoute({
		component: () => (
			<UpcomingPage
				today={today}
				week={week ? toCalendarDate(week) : undefined}
			/>
		),
	})
	const router = createRouter({
		routeTree: rootRoute,
		history: createMemoryHistory({ initialEntries: ['/'] }),
	})
	await router.load()
	return load(renderToStaticMarkup(<RouterProvider router={router} />))
}

describe('UpcomingPage', () => {
	test('renders the current week from today with the overdue section', async () => {
		const $ = await renderPage()
		expect($('h1').text()).toBe('Upcoming')
		expect($('header p').first().text()).toBe('November 2026')
		expect($('#overdue-heading').text()).toBe('Overdue')
		expect($('button:contains("Reschedule")').attr('disabled')).toBeDefined()
		const headings = $('section h2')
			.map((_, heading) => $(heading).text())
			.get()
		expect(headings.slice(0, 4)).toEqual([
			'Overdue',
			'5 Nov · Today · Thursday',
			'6 Nov · Tomorrow · Friday',
			'7 Nov · Saturday',
		])
		expect($('section[id^="day-"]')).toHaveLength(14)
		expect($('button:contains("Add task")')).toHaveLength(14)
	})

	test('highlights today and leaves past days unlinked in the week strip', async () => {
		const $ = await renderPage()
		const days = $('ol li')
		expect(days).toHaveLength(7)
		expect(days.eq(0).find('a')).toHaveLength(0)
		expect(days.eq(0).text()).toBe('Mon 2')
		expect(days.eq(3).find('a').attr('aria-current')).toBe('date')
		expect(days.eq(3).find('a').attr('href')).toBe('/#day-2026-11-05')
	})

	test('disables the previous week on the current week', async () => {
		const $ = await renderPage()
		expect($('[aria-label="Previous week"]').attr('aria-disabled')).toBe('true')
		expect($('a[aria-label="Next week"]').attr('href')).toBe(
			'/?week=2026-11-09'
		)
	})

	test('lists a later week from Monday without the overdue section', async () => {
		const $ = await renderPage('2026-11-12')
		expect($('#overdue-heading')).toHaveLength(0)
		expect($('section h2').first().text()).toBe('9 Nov · Monday')
		expect($('a[aria-label="Previous week"]').attr('href')).toBe(
			'/?week=2026-11-02'
		)
	})
})
