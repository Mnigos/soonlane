---
title: Pull request hygiene
kind: nit
input: metadata
needs: ['Commitlint']
---

Check the pull request's title, description and commits against this repository's rules below. Commitlint already fails a commit message that breaks Conventional Commits, so report only what it cannot see:

- A `feat`, `fix` or `perf` commit with a product scope (`tasks`, `labels`, `projects`, `shell`, `desktop`, `mobile`, `identity`, `site`, `blog`, `changelog`, `consent`) whose subject is not a plain sentence a user can read, or internal work that uses a product scope and would land in the changelog.
- A commit or description with AI attribution (`Co-Authored-By` for a model, "Generated with").
- `CHANGELOG.md` or `version.json` in the changed files of a pull request that is not the release pull request.
- A description that misses the format: no opening sentences, more than five bullets under "What changes", over the word cap, a file inventory, or no `## Deploy` section for a change with a migration or a new environment variable.
- A visible UI change without screenshots in the description.

Name the rule each finding breaks.

@/AGENTS.md#Must
@/CONTRIBUTING.md#Commits
@/.agents/skills/pull-request/SKILL.md#Description Format
