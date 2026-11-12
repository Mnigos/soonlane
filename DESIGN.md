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
  primary: '#cf473a'
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
  label-berry-red: '#b8255f'
  label-red: '#db4035'
  label-orange: '#ff9933'
  label-yellow: '#fad000'
  label-olive-green: '#afb83b'
  label-lime-green: '#7ecc49'
  label-green: '#299438'
  label-mint-green: '#6accbc'
  label-teal: '#158fad'
  label-sky-blue: '#14aaf5'
  label-light-blue: '#96c3eb'
  label-blue: '#4073ff'
  label-grape: '#884dff'
  label-violet: '#af38eb'
  label-lavender: '#eb96eb'
  label-magenta: '#e05194'
  label-salmon: '#ff8d85'
  label-charcoal: '#808080'
  label-grey: '#b8b8b8'
  label-taupe: '#ccac93'
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
    textColor: '{colors.muted-foreground}'
    padding: '0 0 8px'
  day-heading-today:
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

- **Todoist Red** (`primary`, #cf473a): the "Add task" button, today's badge in the week strip, the plus icon in "Add task" rows, focus outlines. White text on it is 4.55:1 and on Pressed Red 5.33:1, both above the AA minimum of 4.5:1.
- **Pressed Red** (`primary-hover`, #c3392c): hover and active state of red controls.
- **Red Wash** (`primary-muted`, #3d2523): background of the active sidebar item.
- **Overdue Coral** (`danger`, #ff7066): text of the active sidebar item, "Reschedule", overdue dates, errors, today's day number in the date picker (5.88:1 on the popover grey, 5.16:1 on the hover grey, where Todoist Red would be 3.50:1 and 3.07:1).

### Priority

Todoist's priority colors, used only on a task's completion circle and the flags in the composer's Priority chip and menu and in a task's "…" menu: **P1** `priority-1` #d1453b, **P2** `priority-2` #eb8909, **P3** `priority-3` #246fe0, **P4** `priority-4` #8a8a8a (the default, no fill).

### Due dates

Todoist's due colors, used only on the date line under a task and the composer's date chip: **today** `due-today` #1ab04d, **tomorrow** `due-tomorrow` #ff9a14, **the next 2 to 7 days** `due-week` #a970ff, later dates in `muted-foreground`, overdue in `danger`.

The date picker's quick date icons, also in a task's "…" menu, use Todoist's own icon colors: the green calendar in `due-today`, the sun in **`quick-tomorrow`** #eb8600, the next week arrow in **`quick-week`** #9147ff, the weekend couch in **`quick-weekend`** #377eff.

### Labels

A label's color is one of Todoist's 20 palette colors, the `label-<key>` tokens with Todoist's hex values (`label-berry-red` #b8255f to `label-taupe` #ccac93, in Todoist's order), drawn only on its tag icon and, in a task row, its name. A label without a color is `label-charcoal` #808080. The color is picked from the sidebar by Todoist's name for it ("Berry red", "Olive green", "Charcoal").

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
- **Pencil** (`muted-foreground`, #a3a3a3): month label, week strip days, headings of days after today, secondary text.
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

### Public site

The landing page and the other public pages (`modules/site`) use the same font stack, colors and hairlines, plus a display scale the app never uses (`site-*` in `tokens.css`):

- **Site display** (700, 2.25rem on phones growing to 3rem from about 960px, line 1.15, tracking -0.025em): the landing's one `h1`.
- **Site title** (700, 1.75rem, line 1.25, tracking -0.015em): section headings such as the feature rows, "Questions" and the closing band.
- **Site body** (400, 1.0625rem, line 1.6): paragraphs and FAQ answers.

Sections stack in a 1120px column and are split by full-width `border` rules, never cards, panels, gradients or shadows. Feature rows put text and screenshot side by side from `lg`, alternating sides, and stack text first on phones. Screenshots of the app get the 1px `border` and an 8px radius and nothing else; the hero's phone screenshot overlaps the desktop one's corner with a ring in the page background (4px, 8px from `lg`). Red stays on "Get started" (or "Open app") and focus outlines.

## 4. Elevation

Flat. The layered surfaces are the mobile drawer, the Add task dialog, the Delete account dialog, the Calendar subscription dialog, the Delete task dialog and the Keyboard shortcuts dialog (all over a 60% black backdrop), the sticky Upcoming header, which uses the page background and a bottom rule instead of a shadow, popovers and menus: `popover` grey, a `border` line, 8px radius and the one allowed shadow, `shadow-lg`, and tooltips: `tooltip` grey, 6px radius, 14px ink text, 6px above the trigger.

## 5. Components

### Buttons

- **Primary**: red fill, white text (passes AA), 36px, 6px radius.
- **Ghost / icon**: no fill, muted icon, hover background; 32px square for icon buttons.
- **Outline**: 1px rule border, used for "Continue with Google".
- Focus: 2px red outline offset by 2px.

### Sidebar

- Full: 224px wide on `sidebar` grey. User row with the collapse button, then the red "Add task" action, nav items (32px rows, 18px icons) and labelled sections such as "Labels".
- Labels section: the "Labels" heading in muted semibold with a chevron that collapses the list (kept while the app is open, also across full and rail), and a ghost "+" ("Add label") on the right. Rows are nav items with a 16px tag icon in the label's color (charcoal without one), the name, and on the right the count of open tasks in muted caption text, left out at 0; sorted by name. On hover or keyboard focus a 24px "…" button takes the count's place (always shown beside it on touch screens) and opens a menu with Rename, Color and a coral Delete. Color has a chevron and opens a submenu beside it: the 20 colors in Todoist's order, each a 16px tag icon in the color and its name, the current one (Charcoal without a color) with a red check; it scrolls when the screen is too short. Picking a color closes the menus and shows it at once everywhere the label appears; if saving fails the old color comes back with "Could not change the label's color. Try again." "+" and Rename turn into an inline field, a 32px box with a `border-strong` line holding the tag icon and the name: Enter saves, Escape or an empty name cancels, and a taken name says "A label with this name already exists." under it. Delete asks first in a dialog, "Delete label?" with `The "name" label will be permanently deleted and removed from its tasks.`, Cancel and a red Delete. With no labels it reads "No labels yet".
- Rail: 56px of icon buttons (avatar, expand, Add task, Upcoming, Today, Labels), each with `aria-label` and a tooltip.
- Active item: red wash background with coral text. Inactive: ink text, hover background.
- The sidebar never moves the content: from `md` the page keeps a rail-wide gutter and the column is centered in the rest. From `xl` (1280px) the owner's choice, full or rail, is docked and remembered in a cookie; between `md` and `xl` the rail is docked and the full sidebar opens over the content; below `md` it is a drawer opened from the top-left button.

### Day sections

- Heading with a hairline below (today's in ink, later days in pencil, like Todoist), then task rows, then a muted "+ Add task" row whose plus turns into a filled red circle on hover.
- The Overdue section has a collapse chevron and a coral "Reschedule" action on the right.
- On Today, a "Completed" section sits above Overdue once a task was completed today: the same collapse chevron, the count in `muted-foreground` after the heading, collapsed on every visit. Its rows have a filled `faint-foreground` circle with a check and the title struck through in `muted-foreground`; clicking the circle reopens the task.

### Label view

- The label's name as the page title, then Overdue (only when it has tasks) and a section for each day from today that has tasks, with the day headings of Upcoming and no Add task row of their own. One "+ Add task" row at the bottom opens the composer due today with the label already chosen; it stays chosen for the next task. With no open tasks a faint "No tasks with this label yet." sits above the row.
- An unknown name reads "Label not found" with "It may have been renamed or deleted." and a "Back to Upcoming" link.

### Week strip

- Seven equal columns for the active day's week: weekday short name and day number side by side, stacked below `sm`. Past days faint and inert.
- Today is bold in ink with its number on the red badge, wherever the list is scrolled.
- The active day (the one at the top of the list) is in ink with a 2px ink segment of the header's bottom rule under it; the segment slides between days unless the owner prefers reduced motion. When the active day is today, both apply.
- Above the strip, right of the title: previous day, the active day's name ("Today", "Tomorrow", then "Mon 9 Nov") which returns to today, next day. The name button keeps one width so the arrows never move. Below `sm` the title sits on the left to make room.

### Tasks

- A task row: a 18px completion circle in its priority color (filled tint for P1 to P3), the title, a one-line description preview, then a meta line: a small calendar icon and the due time if set in the due color, for overdue tasks the date as well ("5 Nov", "5 Nov 11:30"), then each label as a small tag icon and its name in the label's color. A hover shows a check in the circle; clicking it completes the task, hides it from Upcoming and shows a "Task completed" toast with Undo. On the right, a 32px ghost "…" with a "More task actions" tooltip shows on hover or focus (always on touch screens). It opens Todoist's task menu, 224px wide: Edit, which turns the row into the task composer in place (closing it puts focus back on the "…"), a hairline, then "Date" and "Priority", each a 13px semibold heading over a row of 32px icon buttons 12px apart with tooltips, a hairline, and a coral Delete. Date holds the date picker's quick dates as their 22px icons (Today, Tomorrow, This weekend from Monday to Thursday, Next week; the tooltip adds the weekday hint) and a "…" ("More dates") that opens the date picker under the "…" button. Priority holds the four 22px flags, the task's own one framed in `border-strong`. One click saves at once, like the same change in the edit card, and closes the menu. Up and Down move through every item and button in order, Left and Right along a row. The edit card's "…" menu has only Delete.
- A task with a goal shows its progress under the title and description: a caption "20/50 push-ups" in `muted-foreground` over a 2px bar (track `border`, fill `muted-foreground`, at most 192px wide). On the right of the row, before the "…", a 28px ghost "+1" and a 28px "Log amount" icon button (lucide `Diff`) appear on row hover and focus, and always on devices without hover. "Log amount" opens a small popover with one "Amount" field (negative numbers correct mistakes); Enter logs and closes. Reaching the target completes the task with the same "Task completed" toast and Undo.
- The task composer replaces a day's "+ Add task" row inline, as in Todoist: a `card` box with a 12px radius, 12px padding and a `border` line that turns `border-strong` while focused. The title is 16px on a 24px line with a "Task name" placeholder; the description sits right under it, 13px on a 20px line with a "Description" placeholder, no box. Then a row of 28px controls 4px apart: the grey square "+" (`control`), then 28px outlined chips with 16px icons drawn in 1px lines, 13px labels in `secondary-foreground` and 6px padding (the date with Todoist's calendar icon in its due color and no ×, since a task always has a date; Priority; Goal; Labels). On the right a 32px ghost × to cancel and the 32px red square send button with an up arrow, 8px apart; the send button stays red and, with no title, focuses the title. The Priority chip opens a menu centered under it: 32px rows of 22px flags and 13px labels, the selected row on the hover grey with a red check; the chip reads "P1" to "P3" with the colored flag once picked. Typing "p1" to "p4" as a word in the task name sets the Priority chip at once (the last one counts, a later chip pick wins over it), and the word is not saved in the title. While the word sets the chip, it sits on a rounded tint of Todoist Red at 40% (`primary/40`). Typing "@" and a label's name as a word picks that label in the Labels chip, on the same tint, and the word is not saved; deleting the word unpicks the label, and unticking the label deletes the word. While the caret follows an "@", a 248px popover under the "@" lists the owner's labels filtered by what follows, in the label picker's 32px rows without checkboxes, with the `Create label "name"` row for a new name; the arrow keys move, Enter, Tab or a click writes "@name " in the title, and Escape closes the list only. The title keeps focus throughout. In the desktop Quick Add window, the window grows while the list is open. The Goal chip (lucide `Target`) reads "Goal", then the target and unit ("50 push-ups", or "50") in ink once set; it opens a 224px popover under it with "Target" and "Unit" fields (32px, `border` line turning `border-strong` on focus, labels in `muted-foreground` captions) and, once a goal is set, a full-width "Remove goal" button; Enter applies and closes. Enter submits and keeps the card open for the next task, with the priority, time and labels reset (in a label view, back to that label); Escape closes it. Editing a task fills the card with its fields and swaps the up arrow for a check: saving closes the card and the row shows the change at once. The edit card's Goal chip starts with the task's goal and changes or removes it with the rest of the edit; a target at or below the progress completes the task with the "Task completed" toast and Undo, as a log reaching it does. The edit card's Labels chip starts with the task's labels and changes them with the rest of the edit; Cancel leaves them as they were. The edit card also has the row's "…" menu, before the cancel ×; a new task's card never has it.
- Delete asks first in a dialog, "Delete task?" with `The "title" task will be permanently deleted.`, Cancel and a red Delete. Delete closes it and the task leaves every list at once, with no Undo; Escape and Cancel keep it.
- The Labels chip carries the chosen labels, as in Todoist: "Labels" with none; with one, its tag icon in the label's color and its name; with several, the first chosen label and "+N" for the rest ("university +2"). A long name ends in an ellipsis so the chip fits the card at 390px. Once a label is chosen a small × follows inside the chip's border; it clears every label, keeps the picker closed and returns focus to the chip. The chip opens the label picker, a 248px popover centered under the chip: a 40px "Type a label" field with focus, then the owner's labels by name in 32px rows (a 16px tag icon in the label's color, the name, a checkbox on the right that turns red with a white check when chosen). Typing filters by name ignoring case; a click or Enter ticks or unticks a row and the popover stays open; the arrow keys move between rows. A typed name no label has yet adds a `Create label "name"` row with a plus, which creates the label and ticks it; a taken name says "A label with this name already exists." in the popover. With no labels and nothing typed it reads "No labels yet". Escape closes the popover, a second Escape the composer.
- Controls Todoist has and Soonlist does not yet (the "+") keep their place for the layout: muted, `aria-disabled`, inert, with a "Coming soon" tooltip. There is no project chip, because Soonlist has no projects.
- The date chip opens the date picker, Todoist's 248px popover centered over the chip, 2px away: a 40px text field with the current date (it reads "tom", "fri", "14 Nov", "next week"; Enter applies the match), then 32px quick date rows with 22px icons drawn in 1px lines, 13px medium labels and 13px hints in `secondary-foreground` (Today, Tomorrow, This weekend from Monday to Thursday, Next week on Monday, Next weekend on Saturday of next week; the chosen day is left out). Below them Todoist's scrolling calendar: a fixed header with the month at the top in 13px bold ("Nov 2026"), previous, this month (a small circle) and next, and the weekday initials; under it a year of months from today's week, each after the first headed by its short name ("Dec", "Jan 2027"). Days sit in 32px rows on 24px circles: today semibold in Overdue Coral (`danger`) with a small dot, the chosen day on a red circle, weekends in `secondary-foreground`, past days faint and inert. The arrows scroll to a month's first week; arrow keys step by day and week, Page Up and Page Down by month. At the bottom the full-width 32px "Time" and "Repeat" buttons; Repeat is a "Coming soon" placeholder. Picking a day closes the popover; the time stays open for editing and has a clear button. There is no "No Date", since a task needs a due date.

### Keyboard

- Single keys work the task list on a keyboard, never while typing in a field or inside an open menu, popover or dialog, and never with Cmd, Ctrl or Alt held. "J" and "K" (and the arrows once a row is selected) select the next and previous task row; the selected row is the one holding focus, also when focus is on its circle or "…", and it shows the 2px red focus outline offset by 2px and its row controls. On the selected row "E" completes, Enter edits, "T" opens the date picker under the "…" and "1" to "4" set the priority, each exactly as the circle or the "…" menu does.
- The Keyboard shortcuts dialog ("?", or "Keyboard shortcuts" in the user menu, which phones and tablets without a mouse leave out): the delete dialogs' 448px box with the title, then "General", "Navigation" and "Task list" as 13px semibold `muted-foreground` headings over 32px rows, the action on the left and its keys on the right. Keys are small caps (20px high, `hover` grey, a `border` line, 4px radius, 12px `secondary-foreground` text); "then" and "or" between them in muted caption text. Save shows ⌘ on Apple devices and Ctrl elsewhere.

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
- **Don't** add blue outside the P3 priority color, the date picker's weekend couch and the owner's label colors; links and focus use red or neutrals.
- **Don't** open a modal for a one- or two-field action; edit inline. There are five exceptions: the global "Add task" in the sidebar, which opens the task composer in a dialog; "Delete account" in the user menu, which asks for confirmation in a dialog with Cancel and a red "Delete account" button; Delete in a task's "…" menu, which asks "Delete task?" the same way with a red "Delete"; "Calendar link" in the user menu, whose dialog creates, shows once, replaces and revokes the private calendar link; and the Keyboard shortcuts dialog, a read-only list opened with "?" or from the user menu.
- **Don't** introduce projects, boards or team visuals.
