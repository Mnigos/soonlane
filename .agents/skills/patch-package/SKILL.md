---
name: patch-package
description: Patch a dependency with bun patch when an upstream bug blocks work and an upgrade does not fix it. Use when a node_modules fix must persist across installs.
---

## Process

### Step 1: Prepare the package for patching

```bash
bun patch <package-name>
# or with version: bun patch <package-name>@<version>
# or with path: bun patch node_modules/<package-name>
```

This creates an unlinked clone of the package in `node_modules/` that can be edited.

### Step 2: Make changes

Edit the files in `node_modules/<package-name>/` to apply your fixes.

### Step 3: Commit the patch

```bash
bun patch --commit <package-name>
# or: bun patch --commit node_modules/<package-name>
```

This will:

1. Generate a `.patch` file in `patches/` directory
2. Update `package.json` with `patchedDependencies` entry
3. Update the lockfile

## Example

```bash
# Prepare package
bun patch @orpc/server

# Edit files in node_modules/@orpc/server/
# ... make your changes ...

# Commit the patch
bun patch --commit @orpc/server
```

## Notes

- Patch files are committed to the repository and reused across installs
- The `patchedDependencies` in `package.json` tracks all patched packages
- Use `bun patch-commit` as an alias for `bun patch --commit` (pnpm compatibility)

## References

- [Bun Patch Documentation](https://bun.sh/docs/pm/cli/patch)

## Rules

- Check for an upstream release or open issue first; a patch is a last resort.
- Keep the patch minimal and name the upstream issue in the commit body.
- Remove the patch and its `patchedDependencies` entry in the same PR that upgrades past the fix.
