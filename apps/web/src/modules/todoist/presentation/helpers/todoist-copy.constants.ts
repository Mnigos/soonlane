import type { TodoistImportChange } from '@soonlane/domain'
import type { PluralCopy } from './plural-copy.helper'

export const TODOIST_COPY = {
	menuEntry: 'Import from Todoist',
	desktopOpenedInBrowser: 'Import from Todoist opened in your browser.',
	introTitle: 'Import from Todoist',
	introBody:
		'Soonlane will ask Todoist for read-only access and show you a preview first. Nothing is saved until you confirm.',
	introContinue: 'Continue to Todoist',
	cancel: 'Cancel',
	loading: 'Reading from Todoist...',
	previewTitle: 'Import preview',
	changesHeading: 'What will change or be left out',
	notImported:
		'Comments, attachments, reminders, and completed tasks stay in Todoist.',
	nothing: 'There are no open tasks to import.',
	nextStep:
		'Nothing is saved until you import, and this connection will close on its own after 15 minutes or when you cancel.',
	confirm: 'Import into Soonlane',
	importing: 'Importing...',
	accessClosed: 'Access to Todoist is now closed.',
	nothingNew: 'No new tasks to import from Todoist',
	importFailed:
		'Soonlane could not complete the import. Nothing was saved and access to Todoist is closed. Connect again to retry.',
	cancelled: 'Cancelled. Nothing was saved and access to Todoist is closed.',
	readFailed:
		'Soonlane could not read your Todoist account. Nothing was saved, and the connection will be removed within an hour.',
	retry: 'Try again',
	denied: 'Access to Todoist was not granted. Nothing was connected.',
	expired:
		'The Todoist connection closed after 15 minutes. Connect again to see a fresh preview.',
	connectAgain: 'Connect again',
	alreadyUsed:
		'This Todoist account is connected to another Soonlane account right now.',
	linkFailed:
		'Soonlane could not connect to Todoist. Nothing was connected or saved.',
	statusFailed:
		'Soonlane could not load the import status. Reload the page to try again.',
	cancelFailed:
		'Could not disconnect Todoist right now. Soonlane will remove the connection within an hour.',
} as const

export const TODOIST_COUNT_COPY = {
	tasks: { one: '{count} task', other: '{count} tasks' },
	labels: { one: '{count} label', other: '{count} labels' },
	projects: { one: '{count} project', other: '{count} projects' },
	newLabels: {
		one: '{count} new label to create',
		other: '{count} new labels to create',
	},
	existingLabels: {
		one: '{count} label matched to an existing label',
		other: '{count} labels matched to existing labels',
	},
	newProjects: {
		one: '{count} new project to create',
		other: '{count} new projects to create',
	},
	existingProjects: {
		one: '{count} project matched to an existing project',
		other: '{count} projects matched to existing projects',
	},
	importedTitle: {
		one: 'Imported {count} task from Todoist',
		other: 'Imported {count} tasks from Todoist',
	},
	importedWithChanges: {
		one: '{count} task arrived with changes.',
		other: '{count} tasks arrived with changes.',
	},
} as const satisfies Record<string, PluralCopy>

/** One line per change, in the order the preview lists them. */
export const TODOIST_CHANGE_COPY: Record<TodoistImportChange, PluralCopy> = {
	repeating: {
		one: '{count} repeating task will arrive as a one-off task on its next date, without repeating.',
		other:
			'{count} repeating tasks will arrive as one-off tasks on their next date, without repeating.',
	},
	alreadyImported: {
		one: '{count} task imported from Todoist before will be skipped this time.',
		other:
			'{count} tasks imported from Todoist before will be skipped this time.',
	},
	subtasks: {
		one: '{count} subtask will arrive as a separate task.',
		other: '{count} subtasks will arrive as separate tasks.',
	},
	sections: {
		one: '{count} section will be dropped, while its tasks stay.',
		other: '{count} sections will be dropped, while their tasks stay.',
	},
	deadlines: {
		one: '{count} deadline will be dropped, while the task stays.',
		other: '{count} deadlines will be dropped, while the tasks stay.',
	},
	durations: {
		one: '{count} duration will be dropped.',
		other: '{count} durations will be dropped.',
	},
	longTitles: {
		one: '{count} task name longer than 500 characters will be shortened.',
		other: '{count} task names longer than 500 characters will be shortened.',
	},
	longDescriptions: {
		one: '{count} description longer than 4,000 characters will be shortened.',
		other:
			'{count} descriptions longer than 4,000 characters will be shortened.',
	},
	longLabelNames: {
		one: '{count} label name longer than 60 characters will be shortened.',
		other: '{count} label names longer than 60 characters will be shortened.',
	},
	nestedProjects: {
		one: '{count} sub-project will arrive as a separate project.',
		other: '{count} sub-projects will arrive as separate projects.',
	},
	longProjectNames: {
		one: '{count} project name longer than 120 characters will be shortened.',
		other:
			'{count} project names longer than 120 characters will be shortened.',
	},
}
