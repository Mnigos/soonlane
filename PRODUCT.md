# Product

Soonlist is a personal task list for one owner, built around what is coming up. It copies the shape of Todoist's dark theme and drops everything a single person planning their own days does not need.

## Scope

- **Upcoming** (default view at `/`): the week strip, the Overdue section, then one section per day with an "Add task" row.
- **Today** (`/today`): Overdue and today's tasks.
- **Labels**: tags on tasks, listed in the sidebar.

Out of scope: projects, Inbox, filters, reporting, sharing and collaboration.

## Users

One owner signs in with Google. A future desktop app will use the same `/api/rpc` API.

## Design principles

- Look like Todoist's dark theme: left sidebar, centered list column, thin dividers, completion circles, red for actions and overdue.
- Dates read the way Todoist writes them: "5 Nov · Today · Thursday", "6 Nov · Tomorrow · Friday".
- "Today" is the owner's local day, wherever they are.
- English UI copy.
