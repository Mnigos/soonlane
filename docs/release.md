# Releases

The product version lives in `version.json`; the history in `CHANGELOG.md`. Only `.github/workflows/release.yml` writes `version.json` and the lists of changes in `CHANGELOG.md`, so a release never conflicts with a pull request. The one hand edit is the summary at the top of a released section (see Changelog format).

## Nightly

Runs every day at 04:23 UTC and on **Actions → Release → Run workflow** with channel `nightly` (on `main`).

- If `main` has commits since the last nightly tag (release commits do not count), `scripts/release.ts nightly` tags `main` as `vX.Y.Z-nightly.YYYYMMDD.N`. `X.Y.Z` is the next stable version computed from conventional commits; `N` counts that day's nightlies.
- It publishes a GitHub prerelease, never marked latest, whose notes are git-cliff entries since the previous nightly, filtered to product scopes like the changelog.
- Nightly never commits to `main`.

## Stable

Run **Actions → Release → Run workflow** on `main` with channel `stable`.

1. Stable promotes the commit of the latest nightly, not `main` HEAD: verify the nightly, then ship exactly that build. Merges after it wait for the next nightly.
2. The version defaults to the one the nightly previewed (`0.2.0-nightly.*` ships as `0.2.0`); the `version` input overrides it and must be newer than the last stable tag.
3. Version rules (before 1.0): `feat` or a breaking change bumps the minor, `fix` or `perf` the patch; other types never trigger a release. The first release uses `version.json` as is (0.1.0).
4. git-cliff (`cliff.toml`) adds the new release's section at the top of `CHANGELOG.md` with `--latest --prepend`, and leaves every earlier section, summaries included, byte for byte. The section has one entry per `feat`, `fix` and `perf` commit with a product scope (`AGENTS.md`), grouped by type then scope, linked to its commit and PR. A release without product entries keeps its heading; `/changelog` shows it as "Improvements under the hood."
5. The workflow makes one commit on `main` touching only `CHANGELOG.md` and `version.json` (`chore(release): vX.Y.Z`, `[skip ci]`), tags the nightly's commit `vX.Y.Z`, and publishes a GitHub Release marked latest whose notes are the new changelog section.

Nightly and stable share a concurrency group, so they never run at the same time.

`[skip ci]` only stops GitHub Actions. Vercel builds every push to `main` (the project has no Ignored Build Step), so the release commit deploys production and rebuilds `/changelog` from the new `CHANGELOG.md`. After the first stable release, check that the deployment for the release commit reached Ready.

## Version in the app

The build reads `version.json` and `VERCEL_GIT_COMMIT_SHA` (`dev` locally). `system.health` returns `{ version, commit }`, and the sidebar footer shows `vX.Y.Z · <short sha>` with a link to that version's section on `/changelog` (GitHub Releases for prerelease versions).

`/changelog` is prerendered from `CHANGELOG.md` at build time; a line outside the format below fails the build. Nightlies are listed only on GitHub Releases.

## Changelog format

```md
## [0.2.0](https://github.com/Mnigos/soonlane/releases/tag/v0.2.0) - 2026-12-01

One or more short paragraphs for users. Each line is a paragraph.

### Tasks

- One change per bullet, in the product's words. [Links](https://example.com) are allowed.

### Features › tasks

- git-cliff's entry ([abc1234](https://github.com/Mnigos/soonlane/commit/…))
```

- The summary is optional: paragraph lines, then `### <feature area>` headings, each with `- ` entries. A paragraph line may not start like another markdown block (such as `#`, `-`, `*`, `>` or `1.`). Inline links must be `https`; other markdown stays literal text.
- A heading with `›` is git-cliff's list. Everything after the first one belongs to the list, so the summary always goes above it, under the release heading.
- `/changelog` shows the summary first and folds the list into a collapsed "All changes". A section without a summary shows the list as it is.
- The summary is written after the release, by hand or in a release PR, using the product's words (`PRODUCT.md`, `UBIQUITOUS_LANGUAGE.md`) and leaving out internal work. GitHub Release notes carry only git-cliff's list.
- `--prepend` removes `cliff.toml`'s `header` from the file before it writes the new section, so the header in `CHANGELOG.md` must match it exactly.
