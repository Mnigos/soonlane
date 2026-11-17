import { GITHUB_URL } from './landing.constants'

/** `width` and `height` are CSS pixels; the WebP files are captured at 2x. */
export interface HomeImage {
	src: string
	width: number
	height: number
	alt: string
}

export interface HomeFeature {
	title: string
	body: string
	image: HomeImage
}

interface HomeQuestion {
	question: string
	answer: string
	link?: { label: string; href: string }
}

/** Aimed at the search phrase "open source Todoist alternative"; blog posts link home with it. */
export const HOME_TITLE = 'Soonlane: a free, open source Todoist alternative'
export const HOME_DESCRIPTION =
	'A free, open source Todoist alternative. Inbox, Upcoming and Today, with labels, projects and subtasks. Import from Todoist or use the free Mac app.'

export const HOME_HERO = {
	headline: 'Your days, in order.',
	subline:
		'Overdue, today and every day after, in one scrolling list. A free, open source Todoist alternative for your own tasks.',
	todoistImportLine:
		'Coming from Todoist? You can import your open tasks, projects, and labels.',
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

export const HOME_FEATURES: readonly HomeFeature[] = [
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

/** What a signed-in user finds in the app, one row per view or feature. */
export const HOME_CONTENTS = {
	title: 'What you get in your list.',
	items: [
		{
			name: 'Inbox',
			body: 'Hold open tasks that do not have a due date or a project yet.',
		},
		{
			name: 'Upcoming',
			body: 'See a week strip, Inbox, Overdue and each day ahead in one scrolling default view.',
		},
		{
			name: 'Today',
			body: 'Check Inbox, Overdue and everything due today on one page.',
		},
		{
			name: 'Labels',
			body: 'Tag tasks and open any label from the sidebar to see its own view.',
		},
		{
			name: 'Projects',
			body: 'Put a task in a sidebar project while keeping its labels, free on every plan.',
		},
		{
			name: 'Subtasks',
			body: 'Nest subtasks up to four levels deep, and complete the main task to finish the open ones.',
		},
		{
			name: 'Import from Todoist',
			body: 'Preview and bring over open tasks, projects and labels from the account menu.',
		},
		{
			name: 'Mac app',
			body: 'Keep the same list open in its own window on your Mac, for free.',
		},
	],
}

export const HOME_OPEN_SOURCE = {
	title: 'Open source, and yours to read.',
	paragraphs: [
		'The task list is free to use, with a paid Pro plan coming for integrations. The code is open source under AGPL-3.0, so you can read everything that happens to your tasks.',
		'It runs on TanStack Start, React, Effect and Drizzle, hosted on Railway in Amsterdam with Railway Postgres.',
		'A Mac app is in the works.',
	],
	linkLabel: 'Read the source on GitHub',
}

export const HOME_FAQ = {
	title: 'Questions',
	items: [
		{
			question: 'Is Soonlane free?',
			answer:
				'The task list is free, including Upcoming, Today, labels and the Mac app. Sign in with Google to get your own list. Integrations, starting with the calendar link, will move to the paid Pro plan when it launches.',
		},
		{
			question: 'What happens to my tasks?',
			answer:
				'They are stored in the EU, on Railway Postgres in Amsterdam, and only you can see them.',
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
				'Soonlane opens on Upcoming and puts your days in one scrolling list, alongside Inbox, Today, projects, labels and subtasks. It is free and open source, built for one person, with no filters, reporting, teams or shared projects.',
		},
		{
			question: 'Can I import my tasks from Todoist?',
			answer:
				'Yes. Choose Import from Todoist in the account menu to bring over your open tasks, projects, and labels, with a preview before anything is saved. Soonlane uses read-only access and never writes to Todoist. Comments, attachments, reminders, filters, and completed tasks stay in Todoist, and sections and deadlines are left out.',
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
	] satisfies HomeQuestion[],
}

export const HOME_CLOSING_TITLE = 'Plan your days in one list.'
