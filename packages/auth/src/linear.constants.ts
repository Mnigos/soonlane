/** Better Auth's provider id for Linear, which serves only to link an account, never to sign in. */
export const LINEAR_PROVIDER_ID = 'linear'
/** The web page that closes any earlier connection and starts the link; the desktop app opens it in the system browser, where the OAuth state cookie and the session live. A web-only path outside `@soonlane/app`'s `APP_PATHS` (ADR 0015). */
export const LINEAR_CONNECT_PATH = '/linear'
export const LINEAR_GRAPHQL_URL = 'https://api.linear.app/graphql'
export const LINEAR_REVOKE_URL = 'https://api.linear.app/oauth/revoke'
export const LINEAR_TOKEN_URL = 'https://api.linear.app/oauth/token'
/** Better Auth's error code when `/link-social` is refused because the user already has a Linear row. */
export const LINEAR_STILL_CONNECTED = 'LINEAR_STILL_CONNECTED'
