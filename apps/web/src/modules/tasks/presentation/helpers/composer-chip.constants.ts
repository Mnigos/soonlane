/** A chip in the composer's row (date, priority, reminders, labels): Todoist's 28px outlined button. */
export const COMPOSER_CHIP_CLASS =
	'inline-flex h-7 cursor-pointer items-center gap-1 rounded-md border px-1.5 text-label whitespace-nowrap text-secondary-foreground transition-colors hover:bg-hover focus-visible:outline-2 focus-visible:outline-primary data-popup-open:bg-hover [&_svg]:size-4 [&_svg]:shrink-0'

/** A control whose feature is not built yet: kept for Todoist's layout, muted and inert. */
export const COMING_SOON_CLASS =
	'cursor-default text-muted-foreground hover:bg-transparent'

/** Todoist's chip icons draw 1px lines at 16px. */
export const CHIP_ICON_STROKE = 1.5
