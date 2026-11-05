---
name: conventional-commit
description: Use when the user asks to create a commit, generate a Conventional Commit, or open a PR that requires committing scoped changes.
---

# Conventional Commit

Use this skill when the user requests a commit or when scoped commits are needed to fulfill a PR request.

## Flow

1. Inspect `git status`.
2. Inspect staged and unstaged diffs for the intended scope.
3. Compare the diff with user intent and avoid unrelated user changes.
4. Stage only intended files; renames staged by `git mv` count as staged, so check `git status` before committing.
5. Create a concise Conventional Commit message (`bun run commit` opens the commitizen prompt).
6. Commit. The `pre-commit` hook runs `lint-staged` (`ultracite fix` on staged files) and `commit-msg` runs `commitlint`; fix the cause instead of bypassing them.

## Message Rules

- Use `type(scope): subject` when a clear scope exists (`ui`, `db`, `auth`, `tasks`, `identity`, `ci`).
- Use imperative mood; keep the header under 100 characters and body lines under 100.
- Add a body only when the change needs context, trade-offs, or migration notes.
- Use a breaking change footer only for actual breaking changes.

## Safety Rules

- A PR request authorizes the necessary scoped commits and push without separate confirmation. Otherwise, commit only when requested; never push or deploy as part of a commit.
- Never include unrelated changes.
- Prefer small scoped commits when the diff contains multiple logical changes.
- Never use `--no-verify`.
- Never add AI attribution (Co-Authored-By, "Generated with") to messages.
- Do not create branches, GitHub comments or discussions unless explicitly asked.
