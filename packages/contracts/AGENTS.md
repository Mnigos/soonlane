# packages/contracts agent rules

- The only place oRPC contracts live: `src/[name].contract.ts`, composed in `src/app.contract.ts`; shared schemas in `src/[name].schemas.ts`.
- Always declare `.output()`; export inferred types directly under their schema.
- Browser-safe: no Effect, Drizzle, React or server code.
- Dates without time are `CalendarDate` (`YYYY-MM-DD`); the client sends its local "today".
