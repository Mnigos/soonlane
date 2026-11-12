# Analytics

Soonlane sends product analytics, session replays and exceptions to PostHog (EU cloud, project 337571). Everything is optional: without `VITE_POSTHOG_KEY` in the web app nothing is loaded and no consent banner appears, and without `POSTHOG_KEY` on the API no server event or exception is sent. With a key, what is sent depends on each visitor's answer ([Consent](#consent)). Soonlane is a public product: anyone can sign in with Google, so nothing here assumes one user.

## Layout

The browser half lives in `packages/analytics` (`@soonlane/analytics`), so the app and a separate landing load the same banner, the same PostHog setup and the same tracking plan:

- `@soonlane/analytics`: the browser event types (`ClientEvents`), the super properties and the consent cookie (`readConsent`, `hasAnalyticsConsent`, `getConsentCookieDomain`). Plain TypeScript, safe on the server.
- `@soonlane/analytics/client`: the posthog-js client (`trackRouter`, `capture`, `captureException`, `applyConsent`, `resetAnalytics`) and the PostHog configuration.
- `@soonlane/analytics/components/*`: `ConsentProvider` (with the banner and the Privacy choices dialog) and `PrivacyChoicesButton`; `@soonlane/analytics/consent-copy` holds their text.

Each app passes what only it knows. `trackRouter(router, options)` takes the PostHog key, the build properties, the private routes typed against the app's own route tree, and how to find the signed-in user; `ConsentProvider` takes `isAnalyticsEnabled`. In `apps/web` these live in `modules/analytics/presentation/browser-analytics.constants.ts` and `routes/__root.tsx`. The server half lives in the apps: the server events (`ServerEvents`), the `Analytics` port and `PostHogAnalyticsLive` in `apps/api/src/modules/analytics`, the `/ingest` proxy in `apps/web/src/modules/analytics`.

## Naming

Event names and their properties are typed in `packages/analytics/src/analytics-event.types.ts` (browser) and `apps/api/src/modules/analytics/domain/analytics-event.types.ts` (server); a misspelled name or property does not compile. Names are `object_action` in snake_case and the past tense. Properties are snake_case and hold only ids, enums, counts, booleans and durations: never task titles, descriptions, label names, emails or names.

## Events

Each event has one source. The server sends what only the database knows; the browser sends the rest, because only the browser knows the local day, the entry point and the UI choice. Events fire from event handlers and mutation callbacks, never from render.

| Event                    | Fires when                                                                                               | Source | Properties                                                                                     |
| ------------------------ | -------------------------------------------------------------------------------------------------------- | ------ | ---------------------------------------------------------------------------------------------- |
| `user_signed_up`         | Better Auth creates the user (the first sign-in only)                                                    | server | `$set_once`: `created_at`, `signup_date`                                                       |
| `user_signed_in`         | Better Auth creates a session                                                                            | server | `method`: `google` \| `desktop`                                                                |
| `user_signed_out`        | sign-out succeeds, before `reset()`                                                                      | client | none                                                                                           |
| `first_task_created`     | a user's first task is inserted                                                                          | server | `task_id`                                                                                      |
| `desktop_shell_opened`   | the web app loads inside the desktop window                                                              | client | none (`app_version` comes with every event)                                                    |
| `task_created`           | the create mutation succeeds                                                                             | client | `task_id`, `source`, `has_description`, `has_time`, `priority`, `due_in_days`, `is_overdue`    |
| `task_completed`         | the complete mutation succeeds (not the optimistic removal), or a log reaches a goal's target            | client | `task_id`, `priority`, `due_in_days`, `was_overdue`, `completed_via`: `circle` \| `goal`       |
| `task_uncompleted`       | Undo in the "Task completed" toast succeeds (the uncomplete mutation, or the log that reverses a goal), or a task is reopened under Completed on Today or in Search | client | `task_id`, `priority`, `due_in_days`, `was_overdue`, `completed_via`: `undo` \| `reopen` |
| `task_deleted`           | the delete mutation succeeds (not the optimistic removal)                                                | client | `task_id`, `priority`, `due_in_days`                                                           |
| `task_completion_failed` | the complete mutation, an Undo or a reopen fails                                                                   | client | `task_id`, `action`: `complete` \| `uncomplete`                                                |
| `composer_opened`        | Add task opens the composer                                                                              | client | `source`                                                                                       |
| `composer_cancelled`     | an open composer is dismissed and no task was created while it was open                                  | client | `source`                                                                                       |
| `date_picker_used`       | a due date is accepted in the composer's date picker or a task's "…" menu                                 | client | `choice`, `has_time`                                                                           |
| `priority_set`           | the priority chip or a task's "…" menu changes to another priority                                       | client | `priority`                                                                                     |
| `upcoming_day_navigated` | the Upcoming arrows, the today button or a week strip day is clicked                                     | client | `direction`: `next` \| `previous` \| `today` \| `strip`, `distance_days`                       |
| `upcoming_range_loaded`  | the Upcoming list appends weeks                                                                          | client | `weeks_loaded`, `trigger`: `scroll` \| `navigation`                                            |
| `sidebar_toggled`        | the user expands or collapses the sidebar                                                                | client | `state`: `expanded` \| `collapsed`, `mode`: `docked` \| `overlay`                              |
| `consent_updated`        | an analytics answer is applied (after the switch, so a denial goes out cookieless)                      | client | `analytics`: `granted` \| `denied`, `source`: `banner` \| `settings` \| `gpc`                  |
| `calendar_subscription_created` | Create link or Create new link in the Calendar subscription dialog succeeds                    | client | `replaced`: whether a link existed before (never the link or its token)                        |
| `calendar_subscription_revoked` | Revoke link in the Calendar subscription dialog succeeds                                         | client | none                                                                                           |
| `tasks_searched`         | the first result of a search query arrives (not the refetches after a change)                           | client | `result_count` (never the query, its length or its words)                                      |
| `$pageview`, `$pageleave`| a route renders at a new path; `$pageleave` for the previous path just before, and when the tab closes   | client | `route` (super property)                                                                       |
| `$exception`             | an unhandled error or rejection in the browser, a route error caught by the router, an unexpected server error | both | name and stack; server errors never carry a message                                       |

Details:

- The three server events are identified, so the server sends them only when that request carries the granted consent cookie; without it they are not sent at all ([Consent](#consent)).
- `user_signed_in` with `method: desktop` is the desktop sign-in completing: the desktop window exchanged its one-time code for a session (`/desktop/callback`). The system browser's own Google sign-in before it counts as `method: google`. A sign-up is followed by its `user_signed_in`.
- `first_task_created` fires when the user's task count right after the insert is 1. Two first creates that commit at the same moment both count 2, so neither fires; this is accepted, not locked against.
- `source` is `day_row` (Add task under a day in Today or Upcoming), `label_view` (Add task in a label's view), `quick_add` (the desktop Quick Add window, opened with ⌥Space or from the File menu), `sidebar_dialog` (Add task in the rail or the sidebar, which opens the dialog) or `task_row` (Edit in a task's "…" menu, which edits it in place; an edit never sends `task_created`).
- `composer_cancelled` fires for the X button, Escape and the dialog's own dismissal (backdrop, Escape). The dialog closing because a task was created is not a cancel, nor is an inline composer closing because another composer or edit card opened on the page. The composer under a day stays open after a create, so its later dismissal counts only if nothing was created since it opened.
- `due_in_days` is the due date minus the browser's local today, in days (negative when overdue). `is_overdue` and `was_overdue` are the due date before that today, at the moment of the event. For a repeating task, `task_completed` describes the occurrence that was completed, not the next one. `completed_via: goal` fires when the server reports that a log completed the task; a log that would have completed it but fails sends nothing.
- `choice` is `quick_today`, `quick_tomorrow`, `quick_this_weekend`, `quick_next_week`, `quick_next_weekend`, `calendar` or `typed`. A typed date counts when it is accepted (Enter or a click on the match), never per keystroke and never with the text. `has_time` says whether the task has a due time at that moment.
- `distance_days` is the number of days between the active day before the click and the target day. Passive scrolling is not navigation.
- `weeks_loaded` is the Upcoming list's week count after the append (8 at first, plus 4 per append). `trigger: navigation` is the next arrow stepping past the last rendered day.
- `sidebar_toggled` counts the user's clicks only: the docked sidebar from `xl`, and the overlay below it (open button, collapse button, backdrop). The overlay closing on navigation or on Add task is not counted.
- `consent_updated` with `source: gpc` fires once per page load in a browser that sends Global Privacy Control and has no stored answer; count the opt-in rate from `banner` and `settings` only. A choice made on a `/desktop/*` screen is applied at the next page outside them and sends no `consent_updated`. The dialog's Save is `settings`, even when the banner opened it.

## Identity

- With analytics granted, the browser starts anonymous (`person_profiles: 'identified_only'`). When a route renders for a signed-in user whose id differs from PostHog's distinct id, the app calls `identify(user.id, { email, name })`. Email and name are person properties only, never event properties. Earlier anonymous activity in that browser (the sign-in page) merges into the person.
- Sign-out sends `user_signed_out`, then calls `reset()`, opts in again (because `reset()` also clears the SDK's stored consent) and registers the super properties again, so the next account on the same device starts as a new anonymous visitor.
- Deleting the account does the same reset without `user_signed_out`.
- With analytics denied there is no identity: every browser event carries PostHog's cookieless sentinel id, `$cookieless_mode` and `$process_person_profile: false`, and PostHog derives a daily-rotating hash server-side. `internal_or_test_user_hostname: null` turns off the SDK's default test-user mark on localhost, which would set a person property and turn person processing on; the `environment` super property marks development traffic instead. Sign-out sends `user_signed_out` and resets nothing.
- Server events use the user id as the distinct id. The system browser and the desktop window have separate anonymous ids that meet at the same person once both identify.

## Super properties

Every event the app captures carries `app_version` (`version.json`), `commit`, `platform` (`web` or `desktop`, from `<html data-shell="desktop">`), `surface` (`blog` on `/blog` and its posts; `landing` on the other public site routes under the `/_site` layout: `/`, `/changelog`, `/privacy`, `/terms`; `app` everywhere else, the app under `/app`, `/login` and the desktop screens), `environment` (`production`, `staging` or `development`, from `APP_ENV` at build time), `timezone` and `route` (the matched route id, such as `/_session/app/today` or `/_site/privacy`). `route` and `surface` are registered before `identify` and before each `$pageview`, and again with the rest after `reset()`, opting in or out, so exceptions carry it too. The SDK's own internal events (`$set`, replay `$snapshot` envelopes) do not carry super properties. Server events carry `app_version`, `commit` and `environment`.

## Consent

### Categories

- **Essential**, always on, no choice: the Better Auth session cookie, the `soonlane-sidebar` preference cookie and the `<prefix>.consent` consent cookie itself.
- **Analytics**, optional: product analytics with a persistent PostHog id and a person profile linked to the account, plus masked session replay.
- Error reports are not a choice. They rest on legitimate interest in keeping the service working, carry no content (name and stack only), and follow the lanes below: identified with analytics granted, anonymous and cookieless otherwise, not sent from the browser before an answer.

### What each state sends

| | No answer yet | Granted | Denied (banner, settings or GPC) |
| --- | --- | --- | --- |
| posthog-js | not downloaded | loaded | loaded |
| Browser events | none | with a persistent id, identified when signed in | anonymous, cookieless |
| `$pageview`, `$pageleave` | none | yes | anonymous, cookieless |
| Session replay | none | masked | none |
| Browser exceptions | none | identified when signed in | anonymous, cookieless |
| Server events (`user_signed_up`, `user_signed_in`, `first_task_created`) | none | yes | none |
| Server exceptions | always, with the user id when signed in | same | same |
| Cookies and storage | the essential cookies only | posthog-js keys in localStorage and sessionStorage (`ph_<key>_posthog`, `ph_<key>_window_id`, `ph_<key>_session_registered_properties`, `ph_<key>_primary_window_exists`, `__ph_opt_in_out_<key>`), no PostHog cookies | the essential cookies only; nothing of PostHog's is kept (see Legal reasoning) |

On `/desktop/*` (the desktop sign-in and callback screens) posthog-js never starts, whatever the answer: it starts at the first page outside them, so their one-time codes never reach it. Going back into one of them after it started (the browser's Back button) stops replay and loads that page as a fresh document, so the SDK is gone there too.

### Legal reasoning

Following LudusPlatform `docs/guides/Privacy.md` (principles 3 and 5, decisions D1 and D3, "Legal basis"):

- Storing or reading anything on the device needs consent unless strictly necessary (ePrivacy Directive Art. 5(3)). The essential cookies are strictly necessary. A persistent analytics id, person profiles and session replay are not, so they wait for a grant.
- The denied lane keeps nothing on the device, so Art. 5(3) consent is not needed. posthog-js 1.447.3 still runs its usual feature checks there: it writes and at once removes a test key (`__mplssupport__`, `__support__`, `test`) and looks up its own keys (consent, identity, debug, toolbar), which are absent because the app removes them (every `ph_*` and `__ph_*` key and `_postHogToolbarParams`) before starting cookieless. No identifier is stored or read back. Removing every one of these checks would take a fork of the SDK. PostHog's cookieless mode hashes the request server-side with a salt that rotates daily, which gives aggregate audience measurement on legitimate interest (GDPR Art. 6(1)(f); [CNIL audience measurement](https://www.cnil.fr/fr/node/677)).
- Error reports with the user id rest on legitimate interest in keeping the service working (Art. 6(1)(f)).
- Reject is as prominent as Accept on the same layer, closing nothing grants anything, and withdrawing is as easy as granting (Art. 7(3)).
- Cookieless events need the PostHog project setting "Cookieless tracking" turned on. Until it is, PostHog drops them, which only loses anonymous counts.

### The cookie

`<prefix>.consent` (`soonlane.consent` in production, `soonlane-staging.consent` on staging, named after the environment's cookie prefix), first-party, `path=/`, `SameSite=Lax`, one answer for every host of an environment: on `soonlane.com` and its subdomains it is set for `soonlane.com`, on `staging.soonlane.com` and its subdomains for `staging.soonlane.com`, and anywhere else (Railway's generated hosts, localhost) it stays host-only, because a browser refuses a domain the host is not under. Staging hosts also receive production's `soonlane.com` cookie, but its name differs, so each environment reads only its own answer. It is written in the browser through the Cookie Store API, or `document.cookie` where that API is missing (older browsers, plain-http origins). The value is the answer and a version, `granted.1` or `denied.1`. A grant lasts 12 months and a denial 6 months, then the banner asks again; raising the version asks everyone again. The browser reads it after hydration (prerendered pages are built without the visitor's cookie), so the banner never ships in server HTML and appears only when no choice is stored. Without `VITE_POSTHOG_KEY` there is no banner and the cookie is never written.

Answers stored before the cookie was shared, in the host-only `soonlane-consent` cookie, are not read: everyone is asked once more, and that answer covers every host. The new name keeps an old host-only cookie and the shared one from ever travelling under one name.

### Global Privacy Control

A browser that sends Global Privacy Control (`navigator.globalPrivacyControl`) and has no stored answer counts as denied: the banner is not shown and nothing is stored. Privacy choices can still grant analytics, and a stored answer wins over the signal.

### Changing the answer

Privacy choices, in the user menu, in the public site's footer and below the sign-in screens (`/login`, `/desktop/callback` and the desktop sign-in page's Google step), opens a dialog with Essential (always on) and the Analytics switch. Save applies it without a reload:

- **Grant**: `opt_in_capturing()` leaves the cookieless mode, starts the persistent id and replay, then `identify` when signed in.
- **Withdraw**: `opt_out_capturing()` stops and discards replay, resets the identity to the cookieless sentinel (the SDK's own reset), and then every `ph_*` and `__ph_*` key and `_postHogToolbarParams` in localStorage and sessionStorage is removed, as are `ph_*` cookies an older build left (host-only and for the host's domain). Events continue cookieless.

### Copy

The text lives in `packages/analytics/src/consent-copy.constants.ts`.

Banner, a labelled region fixed to the bottom of the viewport, bottom right from 640px (not a modal). It overlays the page, so showing or dismissing it never moves the content:

> **Help improve Soonlane**
> Can we link usage analytics and session replays, with your tasks hidden, to your account? If you reject, we still count pages, actions and errors anonymously, without cookies.
> [Reject] [Accept] Privacy choices

Privacy choices dialog:

> **Privacy choices**
> **Essential** · Always on
> Cookies that keep you signed in and remember your sidebar and these choices. Error reports without your content are always sent, so we can fix problems.
> **Analytics** · switch
> Usage analytics linked to your account and session replays with your tasks, inputs, name and email hidden. When off, we count pages, actions and errors anonymously, without cookies.
> Privacy policy · [Save]

The dialog's Privacy policy link opens `/privacy` and closes the dialog. The banner does not link to it, so Reject and Accept stay its only actions besides Privacy choices.

## Privacy

- No autocapture, no dead-click or heatmap capture: they would record clicked element text, which includes task titles.
- URLs lose their query and hash before an event leaves the browser (`before_send` on every URL-valued property at any depth, and on bare paths under keys ending in `pathname`: exception stack frames, `$set` and `$set_once` included), and in replay page and network URLs. `/desktop/sign-in?challenge=…` and `/desktop/callback#code=…` carry one-time values, and posthog-js never runs there, so its stored initial URL is never one of them.
- A label's name is part of its view's path, so the same rewrite sends `/app/labels/:name` in its place (`$current_url`, `$pathname`, `$referrer`, the `$initial_*` and `$session_entry_*` properties, replay page and network URLs, and link `href`s recorded in replay). Each app lists its private paths in the options it passes to `trackRouter` (`browser-analytics.constants.ts` in `apps/web`), the web ones typed against its router's paths. `route` already carries the route id (`/_session/app/labels/$name`). A calendar link is a secret, so any path under `/calendar/` is sent as `/calendar/:token` the same way.
- `$pageview` is sent without `title`: the label view's document title is the label's name.
- RPC calls are `POST /api/rpc/<procedure>` with the input in the body, so label names and task content never appear in a request URL.
- The calendar link carries a secret, so it is in no event, and the browser never opens it: calendar apps fetch `/calendar/<token>.ics` from the API host, and the API logs and reports neither the URL nor the token ([ADR 0011](decisions/0011-private-calendar-subscription-link.md)). `calendar.createSubscription` returns it in a response body, which replay does not record.
- Feature flags are off (`advanced_disable_feature_flags`): the SDK never calls `/flags`, whose body carries the stored initial URL outside `before_send`.
- Replay keeps the DOM attributes of the app's own assets as they are, for example the development stylesheet's `?routes=` query in a `<link href>`. They carry nothing personal.
- Replay records no network headers or bodies and no console logs. JSON-LD capture is off. Surveys, product tours and conversations are off.
- Server exceptions send the error name and stack frames only: driver errors embed SQL parameters such as session tokens, the same reason the logs carry names only.

## Session replay masking

Replay runs only with analytics granted. Everything is visible except:

- every input's value (`maskAllInputs`), which covers the composer's title, description and typed date;
- text inside an element with the `ph-mask` class: task titles and descriptions in the list, goal text ("20/50 push-ups" in the list, the composer's Goal chip), label names (the sidebar rows, the label view heading, the chips on task rows and in the composer, the label picker's options and its "Create label" row, the "@" suggestions under the composer's title, the tinted copy of the title behind it, the delete-label dialog, and the name field's accessible name), the user's name and email in the user menu, and the email on the desktop hand-off screen;
- the document title (`maskTextSelector: 'title'`), which is a label's name in the label view;
- the label name in a link's `href` (`maskAttributeFn`, the same `/app/labels/:name` rewrite);
- the subtree with the `ph-no-capture` class: the hand-off's "open it from here" link, whose `soonlane://` address carries a one-time code, and the new calendar link in the Calendar subscription dialog (its field and the `webcal:` Subscribe in Calendar link);
- the user's avatar (`ph-no-capture`).

Masking covers text, not attributes, so sensitive text never goes into `aria-label`, `title` or `alt`. Controls named after content take that name from the masked element through `aria-labelledby`: the task's complete button and its goal controls (+1, log amount) from the title, the Goal chip from its masked label, a sidebar label's "More actions" button and a composer chip's "Remove label" button from the label name, and the label name field from a visually hidden masked label.

New UI that shows task content (goal units included), label names, or a user's name or email: add `ph-mask` to the element that renders it, keep that text out of attributes, and block (`ph-no-capture`) anything that holds a code or token. A new route with user content in a path param goes into the app's private routes (`browser-analytics.constants.ts`).

## Proxy and opt-out

The browser sends to `/ingest`, a first-party proxy (`api_host: '/ingest'`, `ui_host: 'https://eu.posthog.com'`). `/ingest/static/*` and `/ingest/array/*` go to `https://eu-assets.i.posthog.com`, everything else to `https://eu.i.posthog.com`. The hosts are constants; only the path and query after `/ingest` are forwarded, with `GET` and `POST` only, a fixed allowlist of request headers (no cookies, no `Authorization`) and no followed redirects. An upstream that does not answer within 10 seconds gets a 504, and one that cannot be reached (DNS, refused connection) a 502. The proxy is a server route of `apps/web`, so a static landing cannot serve it; where it lives after the Railway split (the API host or a Cloudflare rule) is still open.

Without `VITE_POSTHOG_KEY`:

- the browser never downloads `posthog-js` (it is a separate chunk loaded only with a key), so no request goes to `/ingest`;
- there is no consent banner and no Privacy choices entry;
- the server never constructs the PostHog client and every capture is a no-op;
- `/ingest/*` answers 404.

## Insights

- Activation funnel: `user_signed_up` → `first_task_created` → `task_created` on the next day (D1) and in the next week (D7) retention.
- Tasks per active day: `task_created` per person per day, and `task_completed` beside it.
- Composer source mix: `task_created` and `composer_opened` by `source`, and `composer_cancelled` per `composer_opened`.
- Date picker choice mix: `date_picker_used` by `choice`, and `task_created` by `due_in_days`.
- Desktop adoption: `user_signed_in` by `method`, events by `platform`.
- Errors by `route` and `app_version`.
- Consent: `consent_updated` by `analytics` and `source`. Identified insights (funnels, retention, server events) cover only visitors who granted analytics; cookieless events give the anonymous totals.

## Follow-ups

- Account deletion (SOON-38) must delete the person in PostHog too. posthog-node has no person delete; it needs a PostHog personal API key and the REST API, so it is not built yet ([SOON-46](https://linear.app/rigtch/issue/SOON-46/delete-the-posthog-person-when-an-account-is-deleted)).
