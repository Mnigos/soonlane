export type ConsentChoice = 'granted' | 'denied'

export type ConsentState = ConsentChoice | 'gpc' | 'unanswered'

export type ConsentSource = 'banner' | 'settings' | 'gpc'
