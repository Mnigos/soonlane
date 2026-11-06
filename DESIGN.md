---
name: Soonlane
description: A quiet, Todoist-like dark task list organised by days.
colors:
  background: '#1e1e1e'
  sidebar: '#262626'
  hover: '#2c2c2c'
  border: '#333333'
  border-strong: '#656565'
  card: '#242424'
  popover: '#222222'
  control: '#434343'
  tooltip: '#3d3d3d'
  foreground: '#e8e8e8'
  secondary-foreground: '#cbcbcb'
  muted-foreground: '#a3a3a3'
  faint-foreground: '#6f6f6f'
  primary: '#dc4c3e'
  primary-hover: '#c3392c'
  primary-foreground: '#ffffff'
  primary-muted: '#3d2523'
  danger: '#ff7066'
  priority-1: '#d1453b'
  priority-2: '#eb8909'
  priority-3: '#246fe0'
  priority-4: '#8a8a8a'
  due-today: '#1ab04d'
  due-tomorrow: '#ff9a14'
  due-week: '#a970ff'
  quick-tomorrow: '#eb8600'
  quick-week: '#9147ff'
  quick-weekend: '#377eff'
typography:
  page-title:
    fontFamily: '-apple-system, BlinkMacSystemFont, Inter, Segoe UI, Roboto, sans-serif'
    fontSize: '1.25rem'
    fontWeight: 700
    lineHeight: 1.4
  section-heading:
    fontFamily: '-apple-system, BlinkMacSystemFont, Inter, Segoe UI, Roboto, sans-serif'
    fontSize: '0.875rem'
    fontWeight: 600
    lineHeight: 1.4
  body:
    fontFamily: '-apple-system, BlinkMacSystemFont, Inter, Segoe UI, Roboto, sans-serif'
    fontSize: '0.875rem'
    fontWeight: 400
    lineHeight: 1.45
  label:
    fontFamily: '-apple-system, BlinkMacSystemFont, Inter, Segoe UI, Roboto, sans-serif'
    fontSize: '0.8125rem'
    fontWeight: 400
    lineHeight: 1.25
  caption:
    fontFamily: '-apple-system, BlinkMacSystemFont, Inter, Segoe UI, Roboto, sans-serif'
    fontSize: '0.75rem'
    fontWeight: 400
    lineHeight: 1.33
rounded:
  sm: '4px'
  md: '6px'
  full: '9999px'
spacing:
  xs: '4px'
  sm: '8px'
  md: '16px'
  lg: '24px'
  xl: '40px'
components:
  button-primary:
    backgroundColor: '{colors.primary}'
    textColor: '{colors.primary-foreground}'
    rounded: '{rounded.md}'
    padding: '0 12px'
    height: '36px'
  button-ghost:
    backgroundColor: 'transparent'
    textColor: '{colors.muted-foreground}'
    rounded: '{rounded.md}'
    height: '32px'
  sidebar-item:
    backgroundColor: 'transparent'
    textColor: '{colors.foreground}'
    rounded: '{rounded.md}'
    padding: '0 8px'
    height: '36px'
  sidebar-item-active:
    backgroundColor: '{colors.primary-muted}'
    textColor: '{colors.danger}'
    rounded: '{rounded.md}'
    padding: '0 8px'
    height: '36px'
  day-heading:
    backgroundColor: 'transparent'
    textColor: '{colors.foreground}'
    padding: '0 0 8px'
---

# Design System: Soonlane

## 1. Overview

**Creative North Star: "The Dark Planner"**

Soonlane looks like Todoist's dark theme: a warm-grey sidebar on the left, one centered column of days on the right, hairline dividers, and red only where something needs action. The page is a calendar read top to bottom; the date headings are the layout.

Tokens live in `tooling/tailwind-config/tokens.css`; primitives in `packages/ui`. The machine-readable sidecar is `.impeccable/design.json`.

**Key Characteristics:**

- Dark, flat, low-contrast chrome; content in near-white.
- One accent, Todoist red, used for actions, the current day and overdue state.
- Rows and dividers, never cards. The task composer is the one bordered card, as in Todoist.
- Desktop first with a centered list column at most 768px wide; phones get a drawer sidebar.

## 2. Colors

A restrained strategy: tinted neutrals plus one red accent well under 10% of any screen.

### Primary

- **Todoist Red** (`primary`, #dc4c3e): the "Add task" button, today's badge in the week strip, the plus icon in "Add task" rows, focus outlines.
- **Pressed Red** (`primary-hover`, #c3392c): hover and active state of red controls.
- **Red Wash** (`primary-muted`, #3d2523): background of the active sidebar item.
- **Overdue Coral** (`danger`, #ff7066): text of the active sidebar item, "Reschedule", overdue dates, errors.

### Priority

Todoist's priority colors, used only on a task's completion circle and the flags in the composer's Priority chip and menu: **P1** `priority-1` #d1453b, **P2** `priority-2` #eb8909, **P3** `priority-3` #246fe0, **P4** `priority-4` #8a8a8a (the default, no fill).

### Due dates

Todoist's due colors, used only on the date line under a task and the composer's date chip: **today** `due-today` #1ab04d, **tomorrow** `due-tomorrow` #ff9a14, **the next 2 to 7 days** `due-week` #a970ff, later dates in `muted-foreground`, overdue in `danger`.

The date picker's quick date icons use Todoist's own icon colors: the green calendar in `due-today`, the sun in **`quick-tomorrow`** #eb8600, the next week arrow in **`quick-week`** #9147ff, the weekend couch in **`quick-weekend`** #377eff.

### Neutral

- **Desk** (`background`, #1e1e1e): page background.
- **Sidebar** (`sidebar`, #262626): the sidebar column.
- **Hover** (`hover`, #2c2c2c): row and button hover, skeletons.
- **Rule** (`border`, #333333): dividers under headings and between rows.
- **Strong Rule** (`border-strong`, #656565): the composer card's border while it has focus.
- **Card** (`card`, #242424): the task composer card.
- **Popover** (`popover`, #222222): menus and popovers, a step darker than the card as in Todoist.
- **Control** (`control`, #434343): the composer's grey square "+" button.
- **Tooltip** (`tooltip`, #3d3d3d): tooltip background.
- **Ink** (`foreground`, #e8e8e8): task titles and headings.
- **Chalk** (`secondary-foreground`, #cbcbcb): composer chip labels and icons, menu items, the cancel ×.
- **Pencil** (`muted-foreground`, #a3a3a3): month label, week strip days, secondary text.
- **Faint** (`faint-foreground`, #6f6f6f): past days, empty states, placeholders.

### Named Rules

**The One Red Rule.** Red marks something the owner can act on or should not miss. Never decorative.

**The Hairline Rule.** Separation comes from a 1px `border` line or a step in the neutral ramp, not from shadows or boxes.

## 3. Typography

System sans (`-apple-system`, Inter, Segoe UI, Roboto). Weight carries hierarchy; sizes stay small and steady like Todoist.

- **Page title** (700, 1.25rem): "Upcoming", "Today".
- **Section heading** (600, 0.875rem): day headings "5 Nov · Today · Thursday", "Overdue", sidebar section labels.
- **Body** (400, 0.875rem): task titles, nav items, "Add task".
- **Label** (400, 0.8125rem): month label, empty states.
- **Caption** (400, 0.75rem): avatar initials, email in the user menu.

**The Spoken Date Rule.** Dates are written the way people say them: "5 Nov", "Today", "Tomorrow", weekday names in full in headings.

## 4. Elevation

Flat. The layered surfaces are the mobile drawer and the Add task dialog (both over a 60% black backdrop), the sticky Upcoming header, which uses the page background and a bottom rule instead of a shadow, popovers and menus: `popover` grey, a `border` line, 8px radius and the one allowed shadow, `shadow-lg`, and tooltips: `tooltip` grey, 6px radius, 14px ink text, 6px above the trigger.

## 5. Components

### Buttons

- **Primary**: red fill, white text, 36px, 6px radius.
- **Ghost / icon**: no fill, muted icon, hover background; 32px square for icon buttons.
- **Outline**: 1px rule border, used for "Continue with Google".
- Focus: 2px red outline offset by 2px.

### Sidebar

- Full: 224px wide on `sidebar` grey. User row with the collapse button, then the red "Add task" action, nav items (32px rows, 18px icons) and labelled sections such as "Labels".
- Rail: 56px of icon buttons (avatar, expand, Add task, Upcoming, Today, Labels), each with `aria-label` and a tooltip.
- Active item: red wash background with coral text. Inactive: ink text, hover background.
- The sidebar never moves the content: from `md` the page keeps a rail-wide gutter and the column is centered in the rest. From `xl` (1280px) the owner's choice, full or rail, is docked and remembered in a cookie; between `md` and `xl` the rail is docked and the full sidebar opens over the content; below `md` it is a drawer opened from the top-left button.

### Day sections

- Heading with a hairline below, then task rows, then a muted "+ Add task" row whose plus turns into a filled red circle on hover.
- The Overdue section has a collapse chevron and a coral "Reschedule" action on the right.

### Week strip

- Seven equal columns for the active day's week: weekday short name and day number side by side, stacked below `sm`. Past days faint and inert.
- Today is bold in ink with its number on the red badge, wherever the list is scrolled.
- The active day (the one at the top of the list) is in ink with a 2px ink segment of the header's bottom rule under it; the segment slides between days unless the owner prefers reduced motion. When the active day is today, both apply.
- Above the strip, right of the title: previous day, the active day's name ("Today", "Tomorrow", then "Mon 9 Nov") which returns to today, next day. The name button keeps one width so the arrows never move. Below `sm` the title sits on the left to make room.

### Tasks

- A task row: a 18px completion circle in its priority color (filled tint for P1 to P3), the title, a one-line description preview, then a date line with a small calendar icon in the due color: the due time if set, and for overdue tasks the date as well ("5 Nov", "5 Nov 11:30"). A hover shows a check in the circle; clicking it completes the task, hides it from Upcoming and shows a "Task completed" toast with Undo.
- The task composer replaces a day's "+ Add task" row inline, as in Todoist: a `card` box with a 12px radius, 12px padding and a `border` line that turns `border-strong` while focused. The title is 16px on a 24px line with a "Task name" placeholder; the description sits right under it, 13px on a 20px line with a "Description" placeholder, no box. Then a row of 28px controls 4px apart: the grey square "+" (`control`), then 28px outlined chips with 16px icons drawn in 1px lines, 13px labels in `secondary-foreground` and 6px padding (the date with Todoist's calendar icon in its due color and no ×, since a task always has a date; Priority; Reminders; Labels). On the right a 32px ghost × to cancel and the 32px red square send button with an up arrow, 8px apart; the send button stays red and, with no title, focuses the title. The Priority chip opens a menu centered under it: 32px rows of 22px flags and 13px labels, the selected row on the hover grey with a red check; the chip reads "P1" to "P3" with the colored flag once picked. Enter submits and keeps the card open for the next task; Escape closes it.
- Controls Todoist has and Soonlist does not yet (the "+", Reminders, Labels) keep their place for the layout: muted, `aria-disabled`, inert, with a "Coming soon" tooltip. There is no project chip, because Soonlist has no projects.
- The date chip opens the date picker, Todoist's 248px popover centered over the chip, 2px away: a 40px text field with the current date (it reads "tom", "fri", "14 Nov", "next week"; Enter applies the match), then 32px quick date rows with 22px icons drawn in 1px lines, 13px medium labels and 13px hints in `secondary-foreground` (Today, Tomorrow, This weekend from Monday to Thursday, Next week on Monday, Next weekend on Saturday of next week; the chosen day is left out). Below them Todoist's scrolling calendar: a fixed header with the month at the top in 13px bold ("Nov 2026"), previous, this month (a small circle) and next, and the weekday initials; under it a year of months from today's week, each after the first headed by its short name ("Dec", "Jan 2027"). Days sit in 32px rows on 24px circles: today red with a small dot, the chosen day on a red circle, weekends in `secondary-foreground`, past days faint and inert. The arrows scroll to a month's first week; arrow keys step by day and week, Page Up and Page Down by month. At the bottom the full-width 32px "Time" and "Repeat" buttons; Repeat is a "Coming soon" placeholder. Picking a day closes the popover; the time stays open for editing and has a clear button. There is no "No Date", since a task needs a due date.

### Loading

- Skeleton bars on the hover grey in the shape of the list, never spinners.

## 6. Do's and Don'ts

### Do:

- **Do** keep the list column, including the Upcoming header and week strip, in one centered element at most 768px wide.
- **Do** put every date-dependent view behind the browser's local date; show skeletons until it is known.
- **Do** use icons from lucide at 16 to 18px with labels or `aria-label`.
- **Do** keep copy short and in English, without em dashes.

### Don't:

- **Don't** add cards, shadows or gradients.
- **Don't** use red for anything that is not an action, the current day or overdue state.
- **Don't** add blue outside the P3 priority color and the date picker's weekend couch; links and focus use red or neutrals.
- **Don't** open a modal for a one- or two-field action; edit inline. The one exception is the global "Add task" in the sidebar, which opens the task composer in a dialog.
- **Don't** introduce projects, boards or team visuals.
