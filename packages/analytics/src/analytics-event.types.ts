import type { TaskPriority } from '@soonlane/domain'
import type { ConsentChoice, ConsentSource } from './consent.types'
import type { Checked, MatchesWireKeys } from './utils/snake-case-keys.util'

export type ComposerSource =
	| 'day_row'
	| 'inbox_view'
	| 'label_view'
	| 'quick_add'
	| 'sidebar_dialog'
	| 'task_row'

export type DatePickerChoice =
	| 'quick_today'
	| 'quick_tomorrow'
	| 'quick_this_weekend'
	| 'quick_next_week'
	| 'quick_next_weekend'
	| 'calendar'
	| 'typed'
	| 'no_date'

export type UpcomingNavigation = 'next' | 'previous' | 'today' | 'strip'

export type RangeLoadTrigger = 'scroll' | 'navigation'

export interface TaskEventProperties {
	taskId: string
	priority: TaskPriority
	/** Absent for a task without a due date. */
	dueInDays?: number
}

/** The browser's events with their properties in camelCase; `capture` sends the keys in snake_case (`ClientWireKey`). */
export interface ClientEvents {
	user_signed_out: Record<string, never>
	desktop_shell_opened: Record<string, never>
	task_created: TaskEventProperties & {
		source: ComposerSource
		hasDescription: boolean
		hasTime: boolean
		isOverdue: boolean
	}
	task_completed: TaskEventProperties & {
		wasOverdue: boolean
		completedVia: 'circle' | 'goal'
	}
	task_uncompleted: TaskEventProperties & {
		wasOverdue: boolean
		completedVia: 'undo' | 'reopen'
	}
	task_deleted: TaskEventProperties
	task_completion_failed: {
		taskId: string
		action: 'complete' | 'uncomplete'
	}
	composer_opened: { source: ComposerSource }
	composer_cancelled: { source: ComposerSource }
	date_picker_used: { choice: DatePickerChoice; hasTime: boolean }
	priority_set: { priority: TaskPriority }
	upcoming_day_navigated: {
		direction: UpcomingNavigation
		distanceDays: number
	}
	upcoming_range_loaded: { weeksLoaded: number; trigger: RangeLoadTrigger }
	sidebar_toggled: {
		state: 'expanded' | 'collapsed'
		mode: 'docked' | 'overlay'
	}
	consent_updated: { analytics: ConsentChoice; source: ConsentSource }
	calendar_subscription_created: { replaced: boolean }
	calendar_subscription_revoked: Record<string, never>
	tasks_searched: { resultCount: number }
}

export interface SuperProperties {
	appVersion: string
	commit: string
	environment: AppEnvironment
	platform: 'web' | 'desktop'
	surface: 'app' | 'landing' | 'blog'
	timezone: string
	route?: string
}

export type AppEnvironment = 'production' | 'staging' | 'development'

type ListedClientWireKey =
	| 'task_id'
	| 'priority'
	| 'due_in_days'
	| 'source'
	| 'has_description'
	| 'has_time'
	| 'is_overdue'
	| 'was_overdue'
	| 'completed_via'
	| 'action'
	| 'choice'
	| 'direction'
	| 'distance_days'
	| 'weeks_loaded'
	| 'trigger'
	| 'state'
	| 'mode'
	| 'analytics'
	| 'replaced'
	| 'result_count'
	| 'app_version'
	| 'commit'
	| 'environment'
	| 'platform'
	| 'surface'
	| 'timezone'
	| 'route'

/** Every property key PostHog receives from the browser, listed by hand; the PostHog insights and docs/analytics.md use these names. */
export type ClientWireKey = Checked<
	MatchesWireKeys<
		ClientEvents[keyof ClientEvents] | SuperProperties,
		ListedClientWireKey
	>,
	ListedClientWireKey
>
