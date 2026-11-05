# Product

## Register

product

## Users

One person: the owner, planning their own days. They open Soonlist many times a day, mostly on a laptop in short bursts: add a task the moment it comes up, glance at what is due today, move what slipped, and look a week or two ahead. A desktop app is next; it uses the same `/api/rpc` API as the web app. Phones get a responsive layout, not a separate app.

## Product Purpose

Soonlist is a personal, Upcoming-first task list. It keeps the parts of Todoist the owner actually uses (Upcoming, Today, Overdue, labels) and drops the rest. Success means the owner trusts it as the one place for "what do I have to do and when", opens it without friction, and never fights it for features meant for teams.

### Scope

- **Upcoming** (default view at `/`): the week strip, the Overdue section, then one section per day with an "Add task" row.
- **Today** (`/today`): Overdue and today's tasks.
- **Labels**: tags on tasks, listed in the sidebar.
- **Owner-only sign-in** with Google.

Out of scope: projects, Inbox, filters, reporting, sharing, collaboration, comments, reminders by email.

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
