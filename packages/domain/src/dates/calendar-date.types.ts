import type { $brand } from 'zod'

/** A day without time or zone, as `YYYY-MM-DD`; "today" is resolved in the user's own time zone before it becomes one. */
export type CalendarDate = string & $brand<'CalendarDate'>
