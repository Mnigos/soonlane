# Product

## Register

product

## Users

Anyone with a Google account, each planning their own days in a private list. They open Soonlane many times a day, mostly on a laptop in short bursts: add a task the moment it comes up, glance at what is due today, move what slipped, and look a week or two ahead. A desktop app is next; it uses the same `/api/rpc` API as the web app. Phones get a responsive layout, not a separate app.

## Product Purpose

Soonlane is a personal, Upcoming-first task list. It keeps the parts of Todoist the owner actually uses (Upcoming, Today, Overdue, labels, projects) and drops the rest. Success means the owner trusts it as the one place for "what do I have to do and when", opens it without friction, and never fights it for features meant for teams.

### Scope

- **Inbox** (`/app/inbox`): open tasks without a due date and without a project, then an "Add task" row whose task starts without a date. Upcoming and Today show the same tasks in an "Inbox" section.
- **Upcoming** (default view at `/app`): the week strip, the Inbox section, the Overdue section, then one section per day with an "Add task" row.
- **Today** (`/app/today`): Inbox, Overdue and today's tasks.
- **Tasks without a date**: "No date" in the date picker or a task's "…" menu removes the due date, with its time and repeat rule. Such tasks sit above Overdue: in the Inbox section when they have no project, and in a label's or project's view in its "No date" section; both sections share one collapse remembered on the device. They are never overdue, never counted in the Dock badge and never in the calendar feed.
- **Labels**: tags on tasks, listed in the sidebar; each label's view (`/app/labels/$name`) lists its open tasks without a date, then by day.
- **Projects**: named lists, listed in the sidebar; a task belongs to at most one project and keeps its labels; each project's view (`/app/projects/$name`) lists its open tasks without a date, then by day. A task without a project is the normal case. Projects are free on every plan. Deleting a project keeps its tasks; they only lose the project.
- **Calendar subscription** (Pro): one private, read-only link per account that shows open tasks on their days in Apple Calendar or any calendar app; replaced or revoked from the user menu.
- **Sign in with Google**; anyone can sign up, and anyone can delete their account with all its tasks.
- **Plans**: Free and Pro. The task list (Inbox, Upcoming, Today, labels, projects, the Mac app) is free; integrations, starting with the calendar subscription, need Pro.

Out of scope: filters, reporting, sharing, collaboration, comments, reminders by email.

## Brand Personality

Quiet, quick, dependable. It should feel like a well-kept paper planner on a dark desk: nothing shouts except what is overdue. Copy is short, plain English, and talks about days the way people do ("Today", "Tomorrow", "5 Nov · Thursday").

## Anti-references

Not a project-management tool: no boards, no Gantt charts, no team avatars, no dashboards of counts. Not a productivity "system" with streaks, scores or gamification. Not a marketing site. No generic SaaS card grids, no gradients, no glassmorphism.

## Design Principles

Look like Todoist's dark theme for now: left sidebar, a centered list column, thin dividers, completion circles, red for actions and overdue state. Familiarity beats novelty here.

Dates carry the structure. Day headings, the week strip and the Overdue section are the navigation; everything else stays out of their way.

"Today" is the owner's local day, wherever they are. The UI never shows a date computed in another time zone.

Adding a task is always one click away: the sidebar "Add task" and an inline "+ Add task" row under every day.

Desktop first, responsive down to phones: the sidebar becomes a drawer, nothing else changes.

## Accessibility & Inclusion

Keyboard reachable controls with visible focus, real headings for every day section, labelled icon buttons, sufficient contrast on the dark palette, and no meaning carried by red alone: overdue items also sit under the "Overdue" heading.
