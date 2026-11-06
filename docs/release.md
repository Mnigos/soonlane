# Releases

The product version lives in `version.json`; the history in `CHANGELOG.md`. Only `.github/workflows/release.yml` writes these two files, so a pull request never edits them and never conflicts with a release.

## Stable

Run **Actions → Release → Run workflow** on `main` with channel `stable`.

1. `scripts/release.ts stable` computes the version from conventional commits since the last stable tag `vX.Y.Z`. Before 1.0, `feat` or a breaking change bumps the minor and `fix` or `perf` the patch; other types never trigger a release. The first release uses `version.json` as is (0.1.0). The `version` input overrides the computed value.
2. git-cliff (`cliff.toml`) regenerates `CHANGELOG.md`: one entry per `feat`, `fix` and `perf` commit, grouped by type then scope, linked to its commit and PR.
3. The workflow commits `CHANGELOG.md` and `version.json` to `main` as `chore(release): vX.Y.Z` (`[skip ci]`), tags `vX.Y.Z`, and publishes a GitHub Release whose notes are the new changelog section.

## Version in the app

The build reads `version.json` and `VERCEL_GIT_COMMIT_SHA` (`dev` locally). `system.health` returns `{ version, commit }`, and the sidebar footer shows `vX.Y.Z · <short sha>` with a link to the releases page.
