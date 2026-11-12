---
name: release
description: Prepares a Soonlane stable release as a release pull request: picks the version and the nightly to promote, writes the summary for users from the merged PRs and their Linear tickets, adds git-cliff's list under it, and opens `chore(release): vX.Y.Z`. Use when asked to cut, prepare or dry-run a stable release, or to write the changelog for one.
---

# Release

A stable release ships as one pull request that touches only `CHANGELOG.md` and `version.json` (ADR 0012, `docs/release.md`). Merging it runs the stable job, which tags the pinned nightly and publishes the GitHub Release. This skill prepares that PR and stops. Agents never merge it, never tag and never run the release workflow.

**Dry run** (when asked for one, or to preview): do steps 1 to 4 and step 5 with `--out "$(mktemp -d)"`, show both files and the parse check, and touch nothing in git or on GitHub.

## 1. Version and nightly

```sh
git fetch origin --tags
bun --no-env-file scripts/release.ts stable              # add --version X.Y.Z only when Igor names one
```

It prints `version`, `tag`, `previous_tag` (last stable), `source` (the nightly's commit) and `nightly_tag`. The release covers `previous_tag..source`, never `main` HEAD.

## 2. What went in

PRs merged into `main` whose merge commit is in that range:

```sh
gh pr list --state merged --base main --limit 200 \
  --search "merged:>=$(git log -1 --format=%cs "$PREVIOUS_TAG")" \
  --json number,title,headRefName,mergeCommit,url,body
```

Keep a PR when `git merge-base --is-ancestor <mergeCommit> "$SOURCE"` succeeds and the same check against `$PREVIOUS_TAG` fails. A branch named `soon-<n>-…` points at Linear ticket `SOON-<n>`; read each one through Executor's Rigtch Linear connection (`tools.linear_app.user.rigtchLinearMCP`, team SOON) for what the change means to users.

## 3. Summary

Draft the facts first: a short paragraph on what the release brings, then `### <feature area>` headings with `- ` entries.

- Group by feature, not by PR; one entry can cover several PRs. Reuse the areas of earlier sections (Tasks, Labels, Calendar, Mac app, Account and website) when they fit.
- Use the product's words (`PRODUCT.md`, `UBIQUITOUS_LANGUAGE.md`) and say what a user can now do. Leave out internal work: refactors, CI, docs, infrastructure, dependency bumps.
- No hashes or PR numbers; git-cliff's list under the summary carries them.
- Format (`docs/release.md`): a paragraph line never starts like another markdown block (`#`, `-`, `*`, `>`, `1.`), area headings have no `›`, links are `https` only.
- Nothing a user would notice: one paragraph that says so, no areas.

**The final wording comes from Gemini 4 Carbon**, as for all user-facing copy (route in the global `agent-fleet` skill). Send it the draft, the PR and ticket notes and the 0.1.0 section as a style example. If the call fails for any reason, stop and tell Igor; never substitute another model or keep your own wording. Then check its text against the format rules only, and save it to a file.

## 4. Changelog and version file

```sh
git switch --no-track -c "release-$TAG" origin/main     # skip in a dry run
bun --no-env-file scripts/release.ts prepare --summary <summary file> [--version X.Y.Z] [--out <dir>]
```

`prepare` runs git-cliff for `previous_tag..source` labelled `vX.Y.Z` (no tag is created), prepends that one section to `CHANGELOG.md` with the summary under its heading, leaves every earlier section byte for byte, and writes `version.json` as `{ "version": "X.Y.Z", "nightly": "<nightly tag>" }`. The heading's date is the day `prepare` runs.

## 5. Parse check

```sh
bun -e "import { parseChangelog } from './apps/web/src/modules/changelog/infrastructure/changelog.parser.ts'; console.log(parseChangelog(await Bun.file(process.argv[1]).text())[0])" <dir>/CHANGELOG.md
```

It throws on any line outside the format, as the build would. The first release it prints must have a `summary` and the groups.

## 6. Pull request

```sh
git add CHANGELOG.md version.json
git commit -m "chore(release): $TAG"
git push -u origin "release-$TAG"
gh pr create --base main --title "chore(release): $TAG" --body-file <body file>
```

Open it ready for review. The body says which nightly it promotes and from which stable tag, lists the PRs that went in with their links, and says that merging tags the nightly's commit and publishes the GitHub Release. Rate it with `pr-risk`, then stop and hand it to Igor. He edits the summary in the PR; to change the version, run this skill again with `--version` on a fresh branch.
