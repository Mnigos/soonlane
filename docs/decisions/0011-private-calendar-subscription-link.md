# ADR 0011: A private calendar subscription link, the URL as the credential

**Status:** Proposed
**Date:** 2026-11-11

## Context

The owner forgets to open Soonlane but looks at Apple Calendar on the iPhone all day ([SOON-82](https://linear.app/rigtch/issue/SOON-82)). Calendar apps can subscribe to an iCalendar (`.ics`) URL and fetch it in the background, but they send no cookie and no `Authorization` header that an app can set up, so a subscription cannot use the Better Auth session. Every other user-data route in the app sits behind `requireUser` ([ADR 0009](0009-open-sign-in.md)); this one cannot.

## Decision

- **A secret link.** Each account has at most one calendar subscription (`calendar_subscription`, keyed by `owner_id`, cascade on user delete). Creating one draws 32 bytes from `node:crypto`'s CSPRNG and encodes them in base64url (43 characters). The link is `<baseUrl>/calendar/<token>.ics`, built from `AppConfig.baseUrl`, never from a request header. Anyone who holds it can read the owner's open tasks, read-only.
- **Hash at rest.** The table stores only the SHA-256 hex of the token, unique. With 256 bits of entropy a salt or pepper adds nothing, and the feed finds the row by hash, so no secret is compared in application code and there is no timing channel to close. `calendar.createSubscription` returns the full link once; `calendar.getSubscription` returns only that a link exists and when it was created. A lost link is replaced, never shown again.
- **One link, replaced or revoked.** Creating again upserts the row on `owner_id`, so the new hash replaces the old one in the same statement and the old link answers 404 at once. Revoking deletes the row. Deleting the account deletes it by cascade.
- **The route.** `GET /calendar/{$token}.ics` is a raw TanStack Start server route outside `/app` and `/api/rpc`, unauthenticated. A token that is not 43 base64url characters gets 404 before any query; an unknown or revoked one gets 404 too, with an empty body. The feed and every 404 carry `Cache-Control: private, no-store` (no shared cache keeps a copy, so revocation is immediate; calendar apps refresh on their own schedule anyway), `X-Robots-Tag: noindex, nofollow` and `Referrer-Policy: no-referrer`. `robots.txt` disallows `/calendar/`, and the prerender crawl skips it.
- **Logging.** The route never logs or reports the request URL or the token. It catches every failure itself, so nothing reaches the framework's error log with the URL; it logs only the error name and reports the exception through `Analytics.captureException`, which sends name and stack frames only. The client never puts the link in an analytics event, and the dialog that shows it sits in a `ph-no-capture` subtree, so session replay records neither the field nor the `webcal:` address.
- **Feed content.** One `VEVENT` per open task on its current due date: all day without a due time, a floating local time (no `TZID`, no `Z`) with a 30-minute `DURATION` and an alarm at the start with one. The server never computes "today", so overdue tasks stay on their past days and a repeating task shows only its current occurrence. Each event links to `/app` (Upcoming), the only view that lists every future day. `UID` is `<taskId>@soonlane.com`, so a moved task moves.
- **Reading tasks.** The `calendar` module reads tasks through `TasksService.listOpen`, not its own query on `task`, so task ownership and the label mapping stay in the `tasks` module.

## Consequences

- The URL is the credential. Whoever sees it (the calendar app and its sync service, such as iCloud, a shared Mac, a screenshot, Vercel's platform request logs, a proxy) can read the owner's open tasks until the owner replaces or revokes it. The dialog says that anyone with the link can see the tasks.
- There is no expiry and no rate limit on the route; guessing a 256-bit token is not practical, and each miss costs one indexed lookup.
- A subscription shows tasks only; changes in the calendar do not come back. Apple Calendar may drop alarms from subscribed calendars (macOS offers "Remove alerts" on subscribe).
- Rejected: CalDAV or two-way sync (a server protocol and conflict handling for a read-only need), Sign in with Apple or OAuth to calendar providers (a second identity provider and provider APIs per calendar app), a signed token without a table (it could not be revoked without a deny list), storing the token itself (a database leak would expose every feed), and several links per account (no need yet; one link keeps the UI to create, replace, revoke).

## Update 2026-11-12 (SOON-119)

The feed is served on the API host only, at `https://api.soonlane.com/calendar/<token>.ics` (staging `api.staging.soonlane.com`), and new links use that host; event URLs still point at the web app (`APP_URL` + `/app`). The web app no longer answers `/calendar/*`, so links made before the move stop working and must be created again (no backward compatibility, decided by the owner).

## Related

- `apps/api/src/modules/calendar`, `apps/web/src/modules/calendar/presentation`, `packages/db/schema/calendar.schema.ts`, `packages/contracts/src/calendar.contract.ts`
- [ADR 0009](0009-open-sign-in.md)
- `ARCHITECTURE.md`: Calendar subscription; `docs/analytics.md`: Privacy, Session replay masking
