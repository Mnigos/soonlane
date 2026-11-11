# packages/contracts agent rules

- The only place oRPC contracts live: `src/[name].contract.ts`, composed in `src/app.contract.ts`; shared schemas in `src/[name].schemas.ts`.
- Always declare `.output()`; export inferred types directly under their schema.
- Browser-safe: no Effect, Drizzle, React or server code.
- `src/proxy-headers.constants.ts` names the headers the web server adds when it calls the API for a visitor (secret and IP); never put the secret itself here.
- Dates without time are `CalendarDate` (`YYYY-MM-DD`); the client sends its local "today".
- Ids and dates use the branded schemas, never bare `z.uuid()` or `z.iso.date()`: `taskIdSchema`, `labelIdSchema`, `userIdSchema` (`src/ids.schemas.ts`), `calendarDateSchema` for input and the unbounded `storedCalendarDateSchema` for output (`src/calendar-date.schemas.ts`). Clients send plain strings; handlers and outputs get the brands.
