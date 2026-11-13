# ADR 0012: An agent summarizes each release in a release pull request

**Status:** Accepted
**Date:** 2026-11-11

## Context

Until 0.1.0, the stable job in `.github/workflows/release.yml` ran git-cliff over the commits since the last stable tag and wrote `CHANGELOG.md` with one entry per `feat`, `fix` and `perf` commit that has a product scope (`cliff.toml`, `docs/release.md`). The commit subject became the entry, and nobody reviewed the text before it went live. The 0.1.0 section, released on 2026-11-11, shows the cost ([SOON-89](https://linear.app/rigtch/issue/SOON-89)):

- It has 102 entries. Labels alone take five, from five PRs, and nothing groups them into one feature.
- Some subjects talk to developers, for example "Add the label route and the rename and delete mutations".
- An entry cannot change after its commit lands on `main`.
- Commit subjects serve two readers: the git history and the people who read `/changelog`. The product-scope rule in `AGENTS.md` is the only thing that decides what users see, and it is easy to get wrong.

Features that ship over several PRs will make this worse. The Apple Calendar sync project (SOON-83 to SOON-88) will ship as six PRs.

## Decision

- **A summary on top, every change below.** Each release section opens with a summary for users and keeps the list of changes git-cliff generates from commits under it. `/changelog` shows the summary and collapses the list under "All changes", rendered as today: the entry, its area and the short commit hash.
- **An agent drafts the summary, Igor approves.** When Igor asks for a stable release, an agent runs locally (a repo skill, not CI). It reads the PRs merged between the last stable tag and the nightly being promoted, and the Linear tickets their branches name. From those it writes the summary: a short paragraph, then the changes grouped by feature, in the product's words (`PRODUCT.md`, `UBIQUITOUS_LANGUAGE.md`), without internal work. The agent opens a release pull request. Igor edits it and merges it. Agents never merge it.
- **The release PR is the only place that edits `CHANGELOG.md` and `version.json`.** Its branch is `release-vX.Y.Z` and its title is `chore(release): vX.Y.Z`. It touches only those two files. Feature PRs still never touch them.
- **The PR pins what it promotes.** `version.json` gains the nightly tag the release ships, next to the version. Merging the PR changes `version.json` on `main`. That push runs the stable job, which tags the pinned nightly's commit `vX.Y.Z` and publishes the GitHub Release with the new section as its notes. A nightly that runs while the PR is open does not change what ships. Stable still promotes a verified nightly, never `main` HEAD.
- **Versions still come from commit types.** `scripts/release.ts` keeps computing the version from conventional commits (`feat` or a breaking change bumps the minor before 1.0, `fix` and `perf` the patch). The agent proposes that version, and Igor can change it in the PR.
- **Product scopes still pick what users see.** The list of changes is still public, so a `feat`, `fix` or `perf` subject with a product scope stays a plain sentence a user can read. The summary carries the story of the release, so a subject no longer has to explain a feature on its own.
- **git-cliff keeps writing the lists.** In the release PR it adds the new release's list under the summary and leaves older sections untouched, so a release never rewrites an earlier summary. Nightly notes stay on git-cliff too.
- **`/changelog` reads both parts.** A section is `## [X.Y.Z](<release url>) - YYYY-MM-DD`, then the summary (a paragraph and `### <feature area>` headings with `- ` entries), then git-cliff's `### <type> › <area>` groups. A section without a summary still parses. The parser fails the build on any other line.
- **0.1.0 gets a summary too.** Its list of changes stays as released, and the summary goes above it.

## Consequences

- A release takes Igor's time: reading and editing one PR per stable release. A badly written section is his to catch before it ships.
- The release PR's merge commit is the one Vercel deploys to production with the new `/changelog`. The tag points at the nightly's commit, as before.
- Every stable release now has a review point before anything is tagged. If the PR is closed, nothing ships.
- Running the agent locally needs no LLM or Linear key in GitHub Actions. The release depends on a machine with the agent setup.
- Rules to change when this is built: the "never edit `CHANGELOG.md` or `version.json` in a PR" and product-scope lines in `AGENTS.md` and `CLAUDE.md`, `docs/release.md`, the stable job (it regenerates the whole file today, which would drop every summary), `cliff.toml`'s header, the changelog parser, `release.types.ts` and the `/changelog` page.
- Rejected options:
  - Replace the commit list with the summary. The list shows every fix with its commit, which the summary leaves out on purpose.
  - Keep git-cliff with stricter rules. Text still cannot change after merge, and one feature still spreads over many entries.
  - Igor writes every section by hand. Same release PR, more of his time for a first draft an agent can write from PRs and tickets.
  - Run the agent in the release workflow. It needs an LLM key and a Linear key in CI, and Igor would still review its output in a PR.
  - A separate file per release that the build reads. It splits the history across files and changes how `/changelog` loads, for no gain over one file.
  - Tag at merge time with the latest nightly. A nightly that runs while the PR is open would ship code nobody reviewed for that release.

## Related

- `docs/release.md`, `.github/workflows/release.yml`, `scripts/release.ts`, `cliff.toml`
- `apps/site/src/modules/changelog`
- `ARCHITECTURE.md`: Decision records
