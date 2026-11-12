/** Better Auth's provider id for Todoist, which serves only to link an account for an import, never to sign in. */
export const TODOIST_PROVIDER_ID = 'todoist'
/** The web page that starts the link and shows the preview; the desktop app opens it in the system browser, where the OAuth state cookie and the session live. A web-only path outside `@soonlane/app`'s `APP_PATHS`, so a change to the `/app` prefix (ADR 0015) updates it too. */
export const TODOIST_IMPORT_PATH = '/app/todoist'
export const TODOIST_SYNC_URL = 'https://api.todoist.com/api/v1/sync'
/** RFC 7009 revocation, authenticated with the app's client id and secret. */
export const TODOIST_REVOKE_URL = 'https://api.todoist.com/api/v1/revoke'
/** Better Auth's error code when `/link-social` is refused because the user's earlier Todoist connection is still open. */
export const TODOIST_STILL_CONNECTED = 'TODOIST_STILL_CONNECTED'
/** `?error=` values the link can come back with that the import page names on its own. */
export const TODOIST_LINK_ERRORS = {
	denied: 'access_denied',
	alreadyUsed: 'account_already_linked_to_different_user',
} as const
