import { GITHUB_URL } from './site.constants'

/** `width` and `height` are CSS pixels; the WebP files are captured at 2x. */
export interface LandingImage {
	src: string
	width: number
	height: number
	alt: string
}

export interface LandingFeature {
	title: string
	body: string
	image: LandingImage
}

interface LandingQuestion {
	question: string
	answer: string
	link?: { label: string; href: string }
}

/** Aimed at the search phrase "open source Todoist alternative"; blog posts link home with it. */
export const LANDING_TITLE = 'Soonlane: a free, open source Todoist alternative'
export const LANDING_DESCRIPTION =
	'A free, open source Todoist alternative built around your days: overdue, today and every day after in one list, with labels and repeating tasks.'

export const LANDING_HERO = {
	headline: 'Your days, in order.',
	subline:
		'Overdue, today and every day after, in one scrolling list. A free, open source Todoist alternative.',
	githubLabel: 'View on GitHub',
	desktopImage: {
		src: '/site/upcoming-desktop.webp',
		width: 1425,
		height: 900,
		alt: 'Soonlane’s Upcoming view on a laptop: the week strip, three overdue tasks, then the tasks due today and tomorrow.',
	},
	phoneImage: {
		src: '/site/upcoming-phone.webp',
		width: 375,
		height: 844,
		alt: 'Upcoming on a phone, with the week strip above the overdue tasks.',
	},
}

export const LANDING_FEATURES: readonly LandingFeature[] = [
	{
		title: 'Capture a task the moment it comes up.',
		body: 'Add a task under any day, or from Add task in the sidebar. Type tom, fri or 14 Nov in the date picker, pick a priority from P1 to P4 and press Enter. Under a day, the composer stays open for the next task.',
		image: {
			src: '/site/composer.webp',
			width: 800,
			height: 400,
			alt: 'The task composer with a new task, Book flights to Lisbon, due 13 Nov with priority P2.',
		},
	},
	{
		title: 'See what slipped and what is due.',
		body: 'Today puts overdue tasks on top with their dates in red, then everything due today. A task stays in view until you complete it, even after its day has passed.',
		image: {
			src: '/site/today-overdue.webp',
			width: 800,
			height: 610,
			alt: 'Today with three overdue tasks above the four tasks due on Friday 6 Nov.',
		},
	},
	{
		title: 'Look a week or two ahead.',
		body: 'Upcoming keeps scrolling day after day, and the week strip shows which day you are on. For later plans, the date picker has quick picks for tomorrow, next week and next weekend, and a calendar a year ahead.',
		image: {
			src: '/site/date-picker.webp',
			width: 800,
			height: 710,
			alt: 'The date picker reading fri as Fri 6 Nov, with quick picks for tomorrow, next week and next weekend above the calendar.',
		},
	},
]

export const LANDING_OPEN_SOURCE = {
	title: 'Free, and yours to read.',
	paragraphs: [
		'Soonlane is free to use. The code is open source under AGPL-3.0, so you can read everything that happens to your tasks.',
		'It runs on TanStack Start, React, Effect and Drizzle, hosted on Railway in Amsterdam with Neon Postgres in Frankfurt.',
		'A Mac app is in the works.',
	],
	linkLabel: 'Read the source on GitHub',
}

export const LANDING_FAQ = {
	title: 'Questions',
	items: [
		{
			question: 'Is Soonlane free?',
			answer:
				'Yes. Every feature is free to use; sign in with Google to get your own list.',
		},
		{
			question: 'What happens to my tasks?',
			answer:
				'They are stored in the EU, on Neon Postgres in Frankfurt, and only you can see them.',
			link: { label: 'Read the privacy policy', href: '/privacy' },
		},
		{
			question: 'Can I delete my account?',
			answer:
				'Yes. Choose Delete account in the account menu and your account and all your tasks are removed at once.',
		},
		{
			question: 'How is it different from Todoist?',
			answer:
				'Soonlane keeps the part of Todoist built around days and opens on Upcoming. There are no projects and no teams.',
		},
		{
			question: 'Can I run my own copy?',
			answer:
				'Yes. The code is under AGPL-3.0, so if you run a changed copy for other people, share your changes under the same license.',
			link: {
				label: 'Setup steps are in the README',
				href: `${GITHUB_URL}#readme`,
			},
		},
	] satisfies LandingQuestion[],
}

export const LANDING_CLOSING_TITLE = 'Plan your days in one list.'
