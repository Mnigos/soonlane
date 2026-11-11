import type { SignInMethod } from '@soonlane/auth'

/** The events only the server sends; the browser's events are `ClientEvents` in `@soonlane/analytics`. */
export interface ServerEvents {
	user_signed_up: { $set_once: { created_at: string; signup_date: string } }
	user_signed_in: { method: SignInMethod }
	first_task_created: { task_id: string }
}
