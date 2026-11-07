/** A chip in the composer's row (date, priority, reminders, labels): Todoist's 28px outlined button. */
export const COMPOSER_CHIP_CLASS =
	'inline-flex h-7 cursor-pointer items-center gap-1 rounded-md border px-1.5 text-label whitespace-nowrap text-secondary-foreground transition-colors hover:bg-hover focus-visible:outline-2 focus-visible:outline-primary data-popup-open:bg-hover [&_svg]:size-4 [&_svg]:shrink-0'

/** A control whose feature is not built yet: kept for Todoist's layout, muted and inert. */
export const COMING_SOON_CLASS =
	'cursor-default text-muted-foreground hover:bg-transparent hover:text-muted-foreground'

/** Todoist's chip icons draw 1px lines at 16px. */
export const CHIP_ICON_STROKE = 1.5

/** The date picker's full-width "Time" and "Repeat" buttons. */
export const FOOTER_BUTTON_CLASS =
	'flex h-8 w-full cursor-pointer items-center justify-center gap-2 rounded-md border text-label font-semibold text-secondary-foreground transition-colors hover:bg-hover hover:text-foreground focus-visible:outline-2 focus-visible:outline-primary [&_svg]:size-4 [&_svg]:shrink-0'

/** The text field at the top of a chip's popover (the date picker, the label picker). */
export const PICKER_FIELD_ROW_CLASS =
	'flex h-10 shrink-0 items-center border-b px-3'

export const PICKER_FIELD_CLASS =
	'w-full bg-transparent text-sm text-foreground outline-none placeholder:text-faint-foreground'

/** A muted line in a picker when it has nothing to list. */
export const PICKER_NOTE_CLASS =
	'flex h-8 items-center px-3 text-label text-faint-foreground'
