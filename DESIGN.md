---
name: Soonlist
description: A quiet, Todoist-like dark task list organised by days.
colors:
  background: '#1e1e1e'
  sidebar: '#262626'
  hover: '#2c2c2c'
  border: '#333333'
  foreground: '#e8e8e8'
  muted-foreground: '#a3a3a3'
  faint-foreground: '#6f6f6f'
  primary: '#dc4c3e'
  primary-hover: '#c3392c'
  primary-foreground: '#ffffff'
  primary-muted: '#3d2523'
  danger: '#ff7066'
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

# Design System: Soonlist

## 1. Overview

**Creative North Star: "The Dark Planner"**

Soonlist looks like Todoist's dark theme: a warm-grey sidebar on the left, one centered column of days on the right, hairline dividers, and red only where something needs action. The page is a calendar read top to bottom; the date headings are the layout.

Tokens live in `tooling/tailwind-config/tokens.css`; primitives in `packages/ui`. The machine-readable sidecar is `.impeccable/design.json`.

**Key Characteristics:**

- Dark, flat, low-contrast chrome; content in near-white.
- One accent, Todoist red, used for actions, the current day and overdue state.
- Rows and dividers, never cards.
- Desktop first with a centered list column at most 768px wide; phones get a drawer sidebar.

## 2. Colors

A restrained strategy: tinted neutrals plus one red accent well under 10% of any screen.

### Primary

- **Todoist Red** (`primary`, #dc4c3e): the "Add task" button, today's badge in the week strip, the plus icon in "Add task" rows, focus outlines.
- **Pressed Red** (`primary-hover`, #c3392c): hover and active state of red controls.
- **Red Wash** (`primary-muted`, #3d2523): background of the active sidebar item.
- **Overdue Coral** (`danger`, #ff7066): text of the active sidebar item, "Reschedule", overdue dates, errors.

### Neutral

- **Desk** (`background`, #1e1e1e): page background.
- **Sidebar** (`sidebar`, #262626): the sidebar column.
- **Hover** (`hover`, #2c2c2c): row and button hover, skeletons.
- **Rule** (`border`, #333333): dividers under headings and between rows.
- **Ink** (`foreground`, #e8e8e8): task titles and headings.
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

Flat. The only layered surfaces are the mobile drawer (over a 60% black backdrop) and the sticky Upcoming header, which uses the page background and a bottom rule instead of a shadow.

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
- **Don't** add blue; links and focus use red or neutrals.
- **Don't** open a modal for a one- or two-field action; edit inline.
- **Don't** introduce projects, boards or team visuals.
