import type { Duration } from 'effect'

export const WINDOW_TITLE = 'Soonlane'

/** The first launch's size; the system centers the window. */
export const DEFAULT_WINDOW_SIZE = { width: 1200, height: 800 }

/** How far, on each axis, a saved frame must still overlap a display to be restored. */
export const MIN_VISIBLE_PX = 80

/** Resizes and moves arrive many times a second; the frame is saved once they pause. */
export const FRAME_SAVE_DELAY = '400 millis' satisfies Duration.Input
