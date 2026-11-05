# Ubiquitous language

Canonical terms, their UI labels and code names. Keep UI labels in sync with the code that renders them.

## tasks

| Term          | UI label                        | Code                                | Meaning                                                                       |
| ------------- | ------------------------------- | ----------------------------------- | ----------------------------------------------------------------------------- |
| Task          | task, "Add task"                | `task` (from PR 3)                  | One thing to do, with an optional due date and labels.                        |
| Calendar date | "5 Nov"                         | `CalendarDate`                      | A day without time or zone, `YYYY-MM-DD`.                                     |
| Today         | "Today"                         | `useToday`, `getToday`              | The owner's local calendar day, read in the browser. Never the server's date. |
| Upcoming      | "Upcoming"                      | `upcoming.route`, `getUpcomingView` | The default view: the selected week strip, Overdue, then 14 day sections.     |
| Day heading   | "5 Nov · Today · Thursday"      | `getDayHeading`                     | Date, relative name for today and tomorrow, weekday.                          |
| Overdue       | "Overdue", "Reschedule"         | `OverdueSection`                    | Unfinished tasks due before today. Shown only on the current week.            |
| Week          | "Today", previous and next week | `?week=`, `getWeekStart`            | Monday to Sunday.                                                             |
| Label         | "Labels"                        | `label` (later)                     | A tag on tasks, listed in the sidebar. Not a project.                         |
