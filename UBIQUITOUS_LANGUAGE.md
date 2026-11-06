# Ubiquitous language

Canonical terms, their UI labels and code names. Keep UI labels in sync with the code that renders them. Package and module ownership lives in `ARCHITECTURE.md`; this file is only the glossary.

## tasks

| Term          | UI label                                   | Code                                     | Meaning                                                                                   |
| ------------- | ------------------------------------------ | ---------------------------------------- | ----------------------------------------------------------------------------------------- |
| Task          | task, "Add task"                           | `task` (from PR 3)                       | One thing to do, with an optional due date and labels.                                    |
| Calendar date | "5 Nov"                                    | `CalendarDate`                           | A day without time or zone, `YYYY-MM-DD`.                                                 |
| Today         | "Today"                                    | `useToday`, `getToday`                   | The owner's local calendar day, read in the browser. Never the server's date.             |
| Upcoming      | "Upcoming"                                 | `upcoming.route`, `getUpcomingDays`      | The default view: Overdue, then every day from today to the end of the eighth week ahead. |
| Day heading   | "5 Nov · Today · Thursday"                 | `getDayHeading`                          | Date, relative name for today and tomorrow, weekday.                                      |
| Overdue       | "Overdue", "Reschedule"                    | `OverdueSection`                         | Unfinished tasks due before today. Shown only on the current week.                        |
| Week          | week strip, "Today", previous and next day | `getWeekStrip`, `getWeekStart`           | Monday to Sunday; the strip shows the active day's week.                                  |
| Active day    | red badge in the week strip                | `useActiveDay`                           | The day whose section sits at the top of the Upcoming list; not the same as Today.        |
| Owner         | name and avatar in the sidebar             | `OWNER_EMAIL`, `isOwner`, `requireOwner` | The one Google account allowed in.                                                        |
| Label         | "Labels"                                   | `label` (later)                          | A tag on tasks, listed in the sidebar. Not a project.                                     |

## Codebase

| Term              | UI                         | Code                                 | Meaning                                                                                                                                                                  |
| ----------------- | -------------------------- | ------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Module            | none                       | `apps/web/src/modules/<module>`      | A slice of the web app with `domain`, `application`, `infrastructure` and `presentation` layers (`tasks`, `shell`, `identity`).                                          |
| Package           | none                       | `@soonlist/*` in `packages/`         | Code shared beyond the web app: `contracts` (API boundary), `domain` (brands), `ui` (primitives), `db` (schema, migrations), `auth` (Better Auth factory, owner policy). |
| Primitive         | none                       | `@soonlist/ui/components/*`          | An app-agnostic UI building block (button, avatar, sidebar). Not a feature component.                                                                                    |
| Shell             | sidebar, icon rail, drawer | `modules/shell`                      | The page frame around every signed-in view; never moves the centered list column.                                                                                        |
| Feature component | none                       | `modules/*/presentation/components`  | UI that knows the product: day sections, week strip, user menu.                                                                                                          |
| Token             | none                       | `tooling/tailwind-config/tokens.css` | A named color, radius or text size from `DESIGN.md`.                                                                                                                     |
