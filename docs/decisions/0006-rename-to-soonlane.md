# ADR 0006: Rename the product from Soonlist to Soonlane

**Status:** Accepted
**Date:** 2026-11-06

## Context

An existing App Store app is already called Soonlist, so the desktop app could not ship under that name. A trademark search (USPTO, EUIPO, WIPO) found no SOONLANE marks, and soonlane.com is registered for the project. ADRs 0001 to 0005 were written before the rename and still use the old names.

## Decision

- The product, its UI, docs, packages and repository are called Soonlane. The old names map as follows:

  | Before                      | After                       |
  | --------------------------- | --------------------------- |
  | `@soonlist/*` packages      | `@soonlane/*`               |
  | `soonlist/*` lint rules     | `soonlane/*`                |
  | `soonlist/<Service>` tags   | `soonlane/<Service>`        |
  | `soonlist-sidebar` cookie   | `soonlane-sidebar`          |
  | `SOONLIST_URL`              | `SOONLANE_URL`              |
  | `com.mnigos.soonlist`       | `com.mnigos.soonlane`       |
  | `Mnigos/soonlist`           | `Mnigos/soonlane`           |
  | Vercel and Neon `soonlist`  | `soonlane`                  |

- Earlier ADRs keep their text; read them through this table.
- The shell reads the old `soonlist-sidebar` cookie when the new one is missing, so the owner keeps the sidebar choice.
- Production stays on https://soonlist.vercel.app until soonlane.com points at Vercel; the switch steps are in [docs/deploy-vercel.md](../deploy-vercel.md#moving-to-soonlanecom).

## Consequences

- The desktop app gets a new bundle identifier, so macOS treats it as a new app: the old `Soonlist.app` and its data folder (`~/Library/Application Support/com.mnigos.soonlist`, which holds only the saved window frame) stay until deleted, and the first launch of Soonlane opens a window with the default frame.
- GitHub redirects the old repository URL, but `github.repository` reports only the current name. The release and owner review workflows accepted both names while the repository was renamed: the rename came on 2026-11-06, after this change merged, and a follow-up (#24) then made them check only `Mnigos/soonlane`.
- The Neon database keeps the name `soonlist`; renaming it would change every connection string for no gain.

## Related

- `ARCHITECTURE.md`: Decision records
- [ADR 0002](0002-package-layout.md), [ADR 0004](0004-desktop-shell-with-electrobun.md), [ADR 0005](0005-desktop-app-layout.md)
