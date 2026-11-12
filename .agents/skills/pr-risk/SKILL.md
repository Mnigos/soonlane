---
name: pr-risk
description: Rates the risk of a Soonlane pull request and records it as a risk label, a "Risk rating" section in the description and a short attributed comment. Use right after opening a PR, after a push that changes what a PR does, and when asked to rate, re-rate or label a PR's risk.
---

# PR risk rating

The rating says how much of the owner's attention a PR needs before it merges. It is not a grade of the code. Read the diff, decide, write the result in the three places below, and keep them in sync.

A delegated child or subagent only rates and returns the result to its parent; the parent writes labels, the description and the comment.

## The rating

Every rated PR gets exactly one risk level, and `Blocked` beside it while a block holds.

| Label         | Color    | Meaning                                                                                                                                                         |
| ------------- | -------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Low Risk`    | `2DA44E` | A mistake would be cheap: seen at once, by the team, and undone in the next PR. The owner can review it quickly.                                                |
| `Medium Risk` | `FBCA04` | The owner will likely have a comment or ask for a small follow-up, or a mistake would reach users but stay small and easy to undo.                              |
| `High Risk`   | `D73A4A` | A mistake would reach users' accounts, data or privacy, or production itself, or the PR is big enough that it will likely be reworked. It needs a careful read. |
| `Blocked`     | `D6249F` | The PR cannot merge as it stands, whatever its level.                                                                                                           |

Judge the diff, not the title, the size or the folder. A color change in `packages/auth` is not an auth change; seven lines that change which rows a query returns are not small.

### Blocks

- A waiting block: the PR is stacked on a parent that has not merged, or a required check is red or never ran on the head commit. It clears on its own, and the level stays.
- A defect block: the PR breaks a hard repo rule and must change. It edits a generated migration, edits `CHANGELOG.md` or `version.json` outside a release PR (`release` skill), or commits a secret.

### Critical areas

A substantial change in behavior here is `High Risk`; a light touch (a rename, a log line, copy) is `Medium Risk` at most.

- Sign-in and sessions: `packages/auth`, the `identity` modules, cookies, return addresses, desktop sign-in, rate limits.
- Who sees which rows: owner scoping of tasks and labels (`ownedTasks`), the RPC middleware that attaches the user.
- Account deletion and anything that removes user data.
- The private calendar link: token creation, hashing, the public `.ics` handler.
- The database: schema and migrations that drop, rename, retype or move data, and the migrator.
- Privacy: the consent cookie, what PostHog receives, replay masking, logs that could carry tokens.
- What reaches production: `.railway`, the deploy and release workflows, the build of the web server.

### Low lanes

These stay `Low Risk` unless a named reason above raises them:

- One bug fix in the code that already owns the behavior, outside the critical areas.
- Changes that never run for a user: CI workflows that do not decide what deploys, lint rules, `tooling/`, agent docs and skills, ADRs, docs, blog drafts.
- Copy and small visual fixes inside one component.

### Medium signals

When nothing above makes it `High Risk`: a change to `packages/contracts`, a new module, package or table, a new dependency or a major upgrade with code changes, UI that changes several screens, desktop native code (`bun:ffi`, Electrobun APIs), several hundred lines of real code across the API and the web app.

### High signals

Besides critical areas: the PR reaches across most of `apps/api`, `apps/web`, `apps/desktop` and `packages/` at once, builds a second way of doing something the code already does, or cannot be explained in two or three sentences.

Before writing, make the case for one level up and one level down in a sentence each. If both are equally strong, take the higher one for a critical area and the lower one for a bug fix or a change that does not ship.

## What to write

Write all three only when this skill runs as part of opening or updating a PR, or when asked. Fetch the description right before editing it, so an edit made a minute ago is not lost. Never add, remove or rename any other label: `ready for review` belongs to the owner review flow, and the `* Priority` labels belong to the Linear Priority Labels workflow, which copies the SOON ticket's Linear priority. A priority says how soon the work matters, not how risky it is; never move the risk level because of it.

1. **Labels.** Create any missing risk label with the color above (`gh label create`). Remove the risk label that no longer applies before adding the new one; remove `Blocked` as soon as the block clears.
2. **Description.** One section, `## Risk rating`, placed after `## Deploy` and before `Closes #…` (or at the end when neither exists). Replace it when it exists; never add a second one. It does not count toward the description's word cap.

   ```markdown
   ## Risk rating

   **Medium Risk.** <two or three sentences for the author and the owner: what in this PR drives the level, and with `Blocked`, which block holds and what clears it>. Rated at commit <7-char sha>, <YYYY-MM-DD>.
   ```

3. **Comment.** Post one on the first rating and on every change of the labels (a new level, `Blocked` added or removed). When a re-rate leaves the labels as they are, refresh the description quietly and post nothing. Never edit or delete an earlier comment; together they are the rating's history. Write the body to a file and post it with `gh pr comment <n> --body-file <file>`:

   ```markdown
   > [!NOTE]
   > 🤖 **<model> on behalf of Mnigos**

   **Risk rating: Medium Risk[, Blocked]**
   <First rating. | Changed from <previous labels>.>

   <the same sentences as in the description>

   Rated at commit <7-char sha>, <YYYY-MM-DD>. The current rating is always in the description under "Risk rating".
   ```

   `<model>` is the model actually writing the rating, for example `Claude Opus 5.5`. No greeting, no list of findings, nothing else.

## When to rate again

Rate again after a push that changes what the PR does (not a rebase or a review-fix of a typo), after the owner asks for changes, after a required check turns red, and when a stacked parent merges. Raise the level freely; lower it only when its reason is gone (the migration was split out, the parent merged, the scope shrank).
