import type { TaskPriority } from '@soonlane/domain'
import type { ConsentChoice, ConsentSource } from './consent.types'

export type ComposerSource =
	| 'day_row'
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

export type UpcomingNavigation = 'next' | 'previous' | 'today' | 'strip'

export type RangeLoadTrigger = 'scroll' | 'navigation'

export interface TaskEventProperties {
	task_id: string
	priority: TaskPriority
	due_in_days: number
}

export interface ClientEvents {
	user_signed_out: Record<string, never>
	desktop_shell_opened: Record<string, never>
	task_created: TaskEventProperties & {
		source: ComposerSource
		has_description: boolean
		has_time: boolean
		is_overdue: boolean
	}
	task_completed: TaskEventProperties & {
		was_overdue: boolean
		completed_via: 'circle' | 'goal'
	}
	task_uncompleted: TaskEventProperties & {
		was_overdue: boolean
		completed_via: 'undo' | 'reopen'
	}
	task_deleted: TaskEventProperties
	task_completion_failed: {
		task_id: string
		action: 'complete' | 'uncomplete'
	}
	composer_opened: { source: ComposerSource }
	composer_cancelled: { source: ComposerSource }
	date_picker_used: { choice: DatePickerChoice; has_time: boolean }
	priority_set: { priority: TaskPriority }
	upcoming_day_navigated: {
		direction: UpcomingNavigation
		distance_days: number
	}
	upcoming_range_loaded: { weeks_loaded: number; trigger: RangeLoadTrigger }
	sidebar_toggled: {
		state: 'expanded' | 'collapsed'
		mode: 'docked' | 'overlay'
	}
	consent_updated: { analytics: ConsentChoice; source: ConsentSource }
	calendar_subscription_created: { replaced: boolean }
	calendar_subscription_revoked: Record<string, never>
	tasks_searched: { result_count: number }
}

export interface SuperProperties {
	app_version: string
	commit: string
	environment: AppEnvironment
	platform: 'web' | 'desktop'
	surface: 'app' | 'landing' | 'blog'
	timezone: string
	route?: string
}

export type AppEnvironment = 'production' | 'staging' | 'development'
