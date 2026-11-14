# Releases

The product version lives in `version.json`; the history in `CHANGELOG.md`. Only a release pull request edits them, prepared by the `release` skill (ADR 0012); feature PRs never touch them.

## Nightly

Runs every day at 04:23 UTC and on **Actions → Release → Run workflow** with channel `nightly` (on `main`).

- If `main` has commits since the last nightly tag (release commits do not count), `scripts/release.ts nightly` tags `main` as `vX.Y.Z-nightly.YYYYMMDD.N`. `X.Y.Z` is the next stable version computed from conventional commits; `N` counts that day's nightlies.
- It publishes a GitHub prerelease, never marked latest, whose notes are git-cliff entries since the previous nightly, filtered to product scopes like the changelog.
- Nightly never commits to `main`.

## Stable

Ask an agent for a stable release; it runs the `release` skill locally (`--out <dir>` on `scripts/release.ts prepare` gives a dry run) and opens a release PR. Igor edits and merges it; agents never merge it.

1. Stable promotes the commit of the latest nightly, not `main` HEAD: verify the nightly, then ship exactly that build. The release PR pins that nightly in `version.json`, so a nightly that runs while the PR is open changes nothing.
2. The version defaults to the one the nightly previewed (`0.2.0-nightly.*` ships as `0.2.0`); the skill's `--version` overrides it and must be newer than the last stable tag.
3. Version rules (before 1.0): `feat` or a breaking change bumps the minor, `fix` or `perf` the patch; other types never trigger a release. The first release used `version.json` as is (0.1.0).
4. The release PR (branch `release-vX.Y.Z`, title and commit `chore(release): vX.Y.Z`) touches only `CHANGELOG.md` and `version.json`. It adds one section at the top of `CHANGELOG.md`: the summary, drafted from the merged PRs and their Linear tickets, then git-cliff's list (`cliff.toml`) for the commits since the last stable tag up to the nightly's commit. The list has one entry per `feat`, `fix` and `perf` commit with a product scope (`AGENTS.md`), grouped by type then scope, linked to its commit and PR. Every earlier section stays byte for byte. `version.json` becomes `{ "version": "X.Y.Z", "nightly": "<nightly tag>" }`.
5. Merging it pushes a change to `version.json` on `main`, which runs the stable job. If the GitHub Release `vX.Y.Z` already exists, the job does nothing. Otherwise it checks that the pinned nightly tag exists and that the version is newer than the last stable tag, then tags the nightly's commit `vX.Y.Z` and publishes a GitHub Release marked latest whose notes are the new `CHANGELOG.md` section, summary included. It never commits to `main`.
6. **Actions → Release → Run workflow** on `main` with channel `stable` runs the same job, to publish again after a failed run. A tag `vX.Y.Z` that already points at the nightly's commit is kept, and the run publishes its release.
7. GitHub refuses the workflow's tag push when a file under `.github/workflows` changed on `main` after the pinned nightly, since the workflow token may not create a ref that changes workflow files. Then push the tag yourself (`git push origin <nightly tag>^{commit}:refs/tags/vX.Y.Z`) and run step 6.

Nightly and stable share a concurrency group, so they never run at the same time. The merge commit goes through CI like any other push, and Railway deploys it to production with the new `/changelog` ([deploy-railway.md](deploy-railway.md#production)).

## Mobile

The iPhone app ships to TestFlight from **Actions → Mobile → Run workflow** (`.github/workflows/mobile.yml`), on the branch to ship, normally `main`. It never runs on its own. The job runs `eas build` with the `production` profile of `apps/mobile/eas.json` (the production API and cookie prefix, plus the variables of EAS's `production` environment such as the PostHog key) and `--auto-submit`, so EAS uploads the finished build to TestFlight; the job waits for both and fails when either does.

The Android app builds on EAS by hand until its Play Console app exists (SOON-178): `bunx eas-cli@27.7.2 build --platform android --profile <development|preview|production>` makes an APK for `development` and `preview` and an AAB for `production`. It signs in only where the web host's `assetlinks.json` lists its signing key ([deploy-railway.md](deploy-railway.md#web-app)).

1. It needs the `EXPO_TOKEN` repository secret, the EAS project id in `apps/mobile/app.json` (`extra.eas.projectId`, which `eas init` prints), the App Store Connect app id and Apple team id in `submit.production.ios` of `eas.json`, and the signing credentials and App Store Connect API key stored on EAS. While the ids are still placeholders the job stops before building.
2. The version users see is `version.json`'s, read by `apps/mobile/app.config.ts` and shown in Settings. The build number comes from EAS's remote counter, which every production build raises, so nothing is bumped by hand. Builds between two stable releases share the last stable version with higher build numbers.
3. Once Apple releases `X.Y.Z` on the App Store, it takes no more builds of that version; the next upload waits for the next stable release.
4. Release notes follow the `mobile` scope: iPhone changes a user notices are `feat(mobile)` and `fix(mobile)` commits, so they reach the nightly notes and `CHANGELOG.md` like any product scope. TestFlight's "What to Test" and the App Store's "What's New" repeat the `mobile` entries released since the previous upload.

## Version in the app

The build reads `version.json` and the commit: `RAILWAY_GIT_COMMIT_SHA` on Railway's GitHub deploys, `commit.env` on staging deploys, `dev` locally. `system.health` returns `{ version, commit }`, and the sidebar footer shows `vX.Y.Z · <short sha>` with a link to that version's section on `/changelog` (GitHub Releases for prerelease versions).

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
- The summary is written in the release PR, in the product's words (`PRODUCT.md`, `UBIQUITOUS_LANGUAGE.md`), leaving out internal work. GitHub Release notes carry the whole section.
- `--prepend` removes `cliff.toml`'s `header` from the file before it writes the new section, so the header in `CHANGELOG.md` must match it exactly.
