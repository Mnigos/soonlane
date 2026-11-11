import type { CalendarDate, TaskId } from '@soonlane/domain'

export interface FeedTask {
	id: TaskId
	title: string
	description?: string
	dueDate: CalendarDate
	dueTime?: string
	labels: readonly { name: string }[]
}

export interface CalendarFeed {
	tasks: readonly FeedTask[]
	taskUrl: string
	builtAt: Date
}

/** Task ids are UUIDs, so one fixed domain keeps UIDs stable across deployments whatever their host. */
const UID_DOMAIN = 'soonlane.com'
const TIMED_EVENT_DURATION = 'PT30M'
const REFRESH_INTERVAL = 'PT15M'
const LINE_OCTETS = 75
const CRLF = '\r\n'
const utf8 = new TextEncoder()

/** RFC 5545 TEXT: backslash, semicolon, comma and line breaks are escaped; other control characters are not allowed. */
function escapeText(text: string) {
	return text
		.replaceAll('\\', '\\\\')
		.replaceAll(';', '\\;')
		.replaceAll(',', '\\,')
		.replaceAll(/\r\n|\r|\n/gu, '\\n')
		.replaceAll(/(?!\t)\p{Cc}/gu, '')
}

/** Folds a content line at 75 octets without splitting a UTF-8 sequence; continuation lines start with one space. */
function foldLine(line: string) {
	const segments: string[] = []
	const current = { text: '', octets: 0 }

	for (const character of line) {
		const octets = utf8.encode(character).length
		const limit = segments.length === 0 ? LINE_OCTETS : LINE_OCTETS - 1

		if (current.octets + octets > limit) {
			segments.push(current.text)
			current.text = ''
			current.octets = 0
		}
		current.text += character
		current.octets += octets
	}
	segments.push(current.text)

	return segments.join(`${CRLF} `)
}

function toIcsDate(date: CalendarDate) {
	return date.replaceAll('-', '')
}

function toIcsInstant(instant: Date) {
	return `${instant.toISOString().slice(0, 19).replaceAll(/[-:]/gu, '')}Z`
}

function getDescription({ description, labels }: FeedTask) {
	const labelLine =
		labels.length > 0
			? `Labels: ${labels.map(label => label.name).join(', ')}`
			: undefined

	return [description, labelLine].filter(Boolean).join('\n\n')
}

/** A task with a due time is a floating local time (no TZID, no Z) with an alarm at its start; without one it is all day. */
function toEvent(task: FeedTask, { taskUrl, builtAt }: CalendarFeed) {
	const summary = escapeText(task.title)
	const description = getDescription(task)
	const timing = task.dueTime
		? [
				`DTSTART:${toIcsDate(task.dueDate)}T${task.dueTime.replace(':', '')}00`,
				`DURATION:${TIMED_EVENT_DURATION}`,
			]
		: [`DTSTART;VALUE=DATE:${toIcsDate(task.dueDate)}`]
	const alarm = task.dueTime
		? [
				'BEGIN:VALARM',
				'ACTION:DISPLAY',
				'TRIGGER:PT0M',
				`DESCRIPTION:${summary}`,
				'END:VALARM',
			]
		: []

	return [
		'BEGIN:VEVENT',
		`UID:${task.id}@${UID_DOMAIN}`,
		`DTSTAMP:${toIcsInstant(builtAt)}`,
		...timing,
		`SUMMARY:${summary}`,
		...(description ? [`DESCRIPTION:${escapeText(description)}`] : []),
		`URL:${taskUrl}`,
		'TRANSP:TRANSPARENT',
		...alarm,
		'END:VEVENT',
	]
}

export function buildCalendarFeed(feed: CalendarFeed) {
	const lines = [
		'BEGIN:VCALENDAR',
		'VERSION:2.0',
		'PRODID:-//Soonlane//Calendar subscription//EN',
		'CALSCALE:GREGORIAN',
		'X-WR-CALNAME:Soonlane',
		`REFRESH-INTERVAL;VALUE=DURATION:${REFRESH_INTERVAL}`,
		`X-PUBLISHED-TTL:${REFRESH_INTERVAL}`,
		...feed.tasks.flatMap(task => toEvent(task, feed)),
		'END:VCALENDAR',
	]

	return `${lines.map(foldLine).join(CRLF)}${CRLF}`
}
