---
name: investigate-issue
description: Evidence-first investigation of reported problems in Soonlist. Use when the owner pastes a screenshot, log or error, says something is broken, slow, failing or shows the wrong day, asks to investigate, diagnose, debug or triage, or wants an issue drafted from a problem. Ends with a root cause, evidence and an issue sketch; fixes only when asked.
---

# Investigate Issue

Investigate first, prove the cause with evidence, then draft repo-native artifacts. Do not create GitHub issues automatically, and do not start the fix unless the user asked for it in the same request.

## Intake

1. Extract the report from whatever was pasted: screenshot, Vercel log excerpt, browser console, or free text. Write down the exact symptom, when it happened, the URL (production or which preview), the browser time zone when dates are involved, and any identifiers.
2. If the symptom is missing, ask one short question: "What exactly is wrong, and where?" Otherwise do not block.
3. A screenshot is a claim, not evidence. Confirm the state from the deployment or the repo before explaining it.
4. "Fixed, but still broken" is a fresh incident. Re-verify against the current deployment and check that the fix was deployed (`system.health` returns the deployed commit).

## Context Gathering

Run these in parallel where possible:

- Recent git history and merged PRs touching the suspected module, so regressions get tied to a change.
- Architecture: `ARCHITECTURE.md`, `UBIQUITOUS_LANGUAGE.md`, relevant ADRs under `docs/decisions`. Use `domain-model` when ownership or boundaries are unclear.
- Deployment signals, read-only:
  - `bunx vercel@latest ls --scope mnigos-projects` and `bunx vercel@latest inspect <url> --logs` for build failures (migrations run in the build).
  - `bunx vercel@latest logs <url> --scope mnigos-projects` for runtime errors. Logs carry error names only by design; the request path and time narrow it down.
  - `POST /api/rpc/system/health` for the deployed version and database reachability.
  - The database only through read-only SQL against the right Neon branch (`main` for production, `preview` for previews and local). Never print or copy connection strings and never read `.env` files.
- Date bugs: reproduce with the browser time zone of the report; `getToday` takes an explicit time zone in specs.

## Investigation Rules

- Build a pass/fail signal before theorizing: a failing spec, a curl against the dev server, a SQL query that shows the wrong row, or a log line. If no signal is possible, say so, list what was tried, and ask for the artifact that would provide one (HAR, console log, recording).
- Reproduce the symptom the user described, not a nearby one.
- Write 3 to 5 falsifiable hypotheses ranked by likelihood with the prediction each makes, then test them one variable at a time. Show the ranked list early; do not block on a reply.
- Tag temporary logs with a unique prefix such as `[DEBUG-a4f2]` and remove them before finishing.
- State confidence explicitly. If the root cause is uncertain, propose the next diagnostic step instead of asserting.

## Production Safety

Investigation never changes production on its own. Redeploying, changing Vercel env vars, Neon branch resets or data fixes need the owner's explicit go-ahead for that specific action. Propose the action with expected effect and rollback, then wait.

## Output

1. **Finding**: root cause in one or two sentences, with confidence.
2. **Evidence**: concrete artifacts (log line with timestamp, query result, failing spec, commit or PR that introduced it), file paths with line numbers.
3. **Impact**: what is affected, since when, whether it still happens.
4. **Issue sketch**, then ask before creating a GitHub issue:

```md
## Summary

## Problem

## Root Cause

## Proposed Outcome

## Acceptance Criteria

- [ ]

## Validation

- [ ]
```

5. **Fix plan**: behavior-focused steps, regression test seam, rollout and rollback notes. When asked to implement, write the regression spec before the fix and remove all tagged instrumentation.

## Rules

- Never create GitHub issues, comments, discussions or labels without explicit confirmation.
- Keep issue language durable across refactors; put paths and line numbers in the chat summary, not the issue body.
