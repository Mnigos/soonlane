export type ConsentChoice = 'granted' | 'denied'

/** `gpc`: no answer yet, but the browser sends Global Privacy Control, which counts as denied. */
export type ConsentState = ConsentChoice | 'gpc' | 'unanswered'

/** `prompt`: the iPhone app's one-time question after sign-in. */
export type ConsentSource = 'banner' | 'prompt' | 'settings' | 'gpc'
