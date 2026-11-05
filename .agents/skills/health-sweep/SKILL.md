---
name: health-sweep
description: Read-only health sweep of Soonlist deployments and the repository. Checks Vercel production and preview deployments and runtime errors, the database health check, GitHub CI and open PRs, and repo hygiene, dedupes every finding against work already in flight, and ends with issue drafts for what is untracked. Use when the owner asks what is broken, what to pick up next, or for a periodic sweep.
---

# Health Sweep

Find untracked problems and cleanup work without duplicating work in flight. Everything is read-only; nothing is created without the owner's go-ahead.

## 1. Map Work In Flight

In parallel:

- Open PRs and their checks: `gh pr list --state open`, `gh pr checks <n>`.
- Open GitHub issues: `gh issue list --state open`.
- Local branches and worktrees with their dirty count and PR state.

Run `git fetch` first and read code with `git show origin/main:<path>` before calling anything fixed or live.

## 2. Collect Signals

- **Vercel** (`--scope mnigos-projects`): latest production and preview deployments and their state (`vercel ls`), build logs of failed ones (`vercel inspect <url> --logs`; a failed migration fails the build), and runtime errors in the last day (`vercel logs`).
- **Health**: `POST https://soonlist.vercel.app/api/rpc/system/health` with `{"json":null}`; `db` must be `ok` and `version` the latest `main` commit.
- **GitHub Actions**: the last runs on `main` and on open PRs (`gh run list`), including commitlint.
- **Repo**: uncommitted changes on `main`, legacy `max-lines` exceptions in `oxlint.conventions.mts`, TODO/FIXME, outdated `catalog:` pins worth a look, and docs that disagree with code (`ARCHITECTURE.md` tables, `AGENTS.md` layout).

## 3. Triage

| Status              | Meaning                                                     | Action                        |
| ------------------- | ----------------------------------------------------------- | ----------------------------- |
| Tracked             | An open issue or PR covers it                               | Note the link                 |
| Fixed, not deployed | The fix is on `main` but production runs an older commit    | Note the PR, no issue         |
| Noise               | Browser extensions, bots hitting `/api/*` without an origin | Note it, no issue             |
| New                 | Real impact, not covered anywhere                           | Diagnose, then draft an issue |

Diagnose each New cluster with `investigate-issue`.

## 4. Act

- Draft issues in the `investigate-issue` format and ask before creating them.
- Never redeploy, change env vars, reset Neon branches or touch production data without an explicit go-ahead.
- Never remove branches or worktrees; list the removable ones.

## 5. Report

Lead with one table: source, finding, impact, status, link. Then removable branches and the top three suggested pickups, with full URLs for every PR and issue.
