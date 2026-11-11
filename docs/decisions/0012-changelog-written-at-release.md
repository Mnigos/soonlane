# ADR 0012: An agent writes the changelog at release, in a release pull request

**Status:** Proposed
**Date:** 2026-11-11

## Context

Until 0.1.0, the stable job in `.github/workflows/release.yml` ran git-cliff over the commits since the last stable tag and wrote `CHANGELOG.md` with one entry per `feat`, `fix` and `perf` commit that has a product scope (`cliff.toml`, `docs/release.md`). The commit subject became the entry, and nobody reviewed the text before it went live. The 0.1.0 section, released on 2026-11-11, shows the cost ([SOON-89](https://linear.app/rigtch/issue/SOON-89)):

- It has 102 entries. Labels alone take five, from five PRs, and nothing groups them into one feature.
- Some subjects talk to developers, for example "Add the label route and the rename and delete mutations".
- An entry cannot change after its commit lands on `main`.
- Commit subjects serve two readers: the git history and the people who read `/changelog`. The product-scope rule in `AGENTS.md` is the only thing that decides what users see, and it is easy to get wrong.

Features that ship over several PRs will make this worse. The Apple Calendar sync project (SOON-83 to SOON-88) will ship as six PRs.

## Decision

- **An agent drafts, Igor approves.** When Igor asks for a stable release, an agent runs locally (a repo skill, not CI). It reads the PRs merged between the last stable tag and the nightly being promoted, and the Linear tickets their branches name. From those it writes the new section of `CHANGELOG.md`. The section groups changes by feature, uses the product's words (`PRODUCT.md`, `UBIQUITOUS_LANGUAGE.md`) and leaves out internal work. The agent opens a release pull request. Igor edits it and merges it. Agents never merge it.
- **The release PR is the only place that edits `CHANGELOG.md` and `version.json`.** Its branch is `release-vX.Y.Z` and its title is `chore(release): vX.Y.Z`. It touches only those two files. Feature PRs still never touch them.
- **The PR pins what it promotes.** `version.json` gains the nightly tag the release ships, next to the version. Merging the PR changes `version.json` on `main`. That push runs the stable job, which tags the pinned nightly's commit `vX.Y.Z` and publishes the GitHub Release with the new section as its notes. A nightly that runs while the PR is open does not change what ships. Stable still promotes a verified nightly, never `main` HEAD.
- **Versions still come from commit types.** `scripts/release.ts` keeps computing the version from conventional commits (`feat` or a breaking change bumps the minor before 1.0, `fix` and `perf` the patch). The agent proposes that version, and Igor can change it in the PR.
- **Commit subjects describe the change for developers.** Product scopes stay as a hint for the agent and for nightly notes. A subject no longer has to read as a user-facing sentence.
- **Nightly notes stay on git-cliff.** Their readers are developers checking a build, and a commit list suits them. `cliff.toml` is used only for nightly notes.
- **`/changelog` reads a looser format.** Each section is `## [X.Y.Z](<release url>) - YYYY-MM-DD`, an optional short paragraph, then `### <feature area>` headings with `- ` entries that may end in PR links. The parser still fails the build on any line outside that format. The 0.1.0 section stays as it is and still parses.

## Consequences

- A release takes Igor's time: reading and editing one PR per stable release. A badly written section is his to catch before it ships.
- The release PR's merge commit is the one Vercel deploys to production with the new `/changelog`. The tag points at the nightly's commit, as before.
- Every stable release now has a review point before anything is tagged. If the PR is closed, nothing ships.
- Running the agent locally needs no LLM or Linear key in GitHub Actions. The release depends on a machine with the agent setup.
- Rules to change when this is built: the "never edit `CHANGELOG.md` or `version.json` in a PR" and product-scope lines in `AGENTS.md` and `CLAUDE.md`, `docs/release.md`, the stable job, `cliff.toml`'s header, the changelog parser and `release.types.ts`.
- Rejected options:
  - Keep git-cliff with stricter rules. Text still cannot change after merge, and one feature still spreads over many entries.
  - Igor writes every section by hand. Same release PR, more of his time for a first draft an agent can write from PRs and tickets.
  - Run the agent in the release workflow. It needs an LLM key and a Linear key in CI, and Igor would still review its output in a PR.
  - A separate file per release that the build reads. It splits the history across files and changes how `/changelog` loads, for no gain over one file.
  - Tag at merge time with the latest nightly. A nightly that runs while the PR is open would ship code nobody reviewed for that release.

## Related

- `docs/release.md`, `.github/workflows/release.yml`, `scripts/release.ts`, `cliff.toml`
- `apps/web/src/modules/changelog`
- `ARCHITECTURE.md`: Decision records
