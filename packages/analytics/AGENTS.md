# packages/analytics agent rules

- The browser half of analytics, shared by every app that renders Soonlane pages: the consent cookie, the banner and Privacy choices, the posthog-js client, and the browser event types. The server half lives in `apps/api`: posthog-node, `ServerEvents` and the `/ingest` proxy.
- The root export is plain TypeScript the server may import (`hasAnalyticsConsent`); `/client` and `/components/*` are browser code and load posthog-js lazily.
- No Effect, no app imports, no data fetching. What only an app knows (PostHog key, build properties, private routes, the signed-in user, whether analytics is enabled, the cookie prefix that names the consent cookie) arrives as `trackRouter` options or `ConsentProvider` props.
- `/cookie` is the cookie writer the app's other first-party cookies use too; the reader is `readCookie` from `@soonlane/domain`, so the root export stays free of DOM code.
- `docs/analytics.md` is the tracking plan and the consent rules; change it with any event, property, cookie or copy here.
- `apps/web/src/styles.css` scans this package with `@source`.
