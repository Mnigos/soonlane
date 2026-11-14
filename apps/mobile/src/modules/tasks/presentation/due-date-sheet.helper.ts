import { DUE_DATE_SHORTCUT_CHOICES } from '@soonlane/app/tasks/helpers/due-date-choice.constants'
import type { CalendarDate, DueDateShortcut } from '@soonlane/domain'
import { showActionSheet } from '@/modules/shell/presentation/action-sheet.client'

type DueDateChoice =
	| (typeof DUE_DATE_SHORTCUT_CHOICES)[keyof typeof DUE_DATE_SHORTCUT_CHOICES]
	| 'no_date'

interface DueDateSheetOptions {
	shortcuts: DueDateShortcut[]
	/** Adds "No date" after the quick dates. */
	hasNoDate: boolean
	noDateHint: string | undefined
	onChange: (date: CalendarDate | undefined, choice: DueDateChoice) => void
}

/** The web's quick dates as an action sheet, each with its weekday hint as in the web's aria-labels ("Tomorrow, Sat"). */
export function showDueDateSheet({
	shortcuts,
	hasNoDate,
	noDateHint,
	onChange,
}: DueDateSheetOptions) {
	const options = [
		...shortcuts.map(({ label, hint }) => `${label}, ${hint}`),
		...(hasNoDate ? [noDateHint ? `No date, ${noDateHint}` : 'No date'] : []),
		'Cancel',
	]

	showActionSheet({ title: 'Date', options }, index => {
		const shortcut = shortcuts[index]

		if (shortcut)
			onChange(shortcut.date, DUE_DATE_SHORTCUT_CHOICES[shortcut.id])
		else if (hasNoDate && index === shortcuts.length)
			onChange(undefined, 'no_date')
	})
}
