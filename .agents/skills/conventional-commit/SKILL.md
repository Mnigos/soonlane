---
name: conventional-commit
description: Use when the user asks to create a commit or generate a Conventional Commit message for scoped changes.
---

# Conventional Commit

Use this skill when the user requests a commit.

## Flow

1. Inspect `git status`.
2. Inspect staged and unstaged diffs for the intended scope.
3. Compare the diff with user intent and avoid unrelated user changes.
4. Stage only intended files when staging is needed.
5. Create a concise Conventional Commit message.
6. Commit.

## Message Rules

- Use `type(scope): subject` when a clear scope exists.
- Use imperative mood.
- Keep the subject concise.
- Add a body only when the change needs context, tradeoffs, or migration notes.
- Use a breaking change footer only for actual breaking changes.

## Safety Rules

- Commit only when the user asks; never push or deploy as part of a commit.
- Never include unrelated changes.
- Prefer small scoped commits when the diff contains multiple logical changes.
- Never add AI attribution (Co-Authored-By, "Generated with") to messages.
- Do not create branches, GitHub comments or discussions unless explicitly asked.
