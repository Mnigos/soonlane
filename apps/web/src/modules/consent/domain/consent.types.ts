export type ConsentChoice = 'granted' | 'denied'

/** `gpc`: no answer yet, but the browser sends Global Privacy Control, which counts as denied. */
export type ConsentState = ConsentChoice | 'gpc' | 'unanswered'

export type ConsentSource = 'banner' | 'settings' | 'gpc'
