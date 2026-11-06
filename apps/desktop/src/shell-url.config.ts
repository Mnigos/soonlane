const PRODUCTION_URL = 'https://soonlist.vercel.app'

/** The hosted web app the window loads; `bun run dev` points it at the local dev server. */
export const SHELL_URL = new URL(process.env.SOONLIST_URL ?? PRODUCTION_URL)
