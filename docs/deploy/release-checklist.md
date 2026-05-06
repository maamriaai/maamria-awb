# Release checklist

Run through this every time before you publish. Skipping a step has bitten every CLI maintainer at least once.

## 1. Source of truth is clean

```bash
cd maamria-awb
git status            # working tree clean
git pull --ff-only    # up to date with main
```

## 2. Tests / type-check / build all green

```bash
npm install
npm run build         # tsc must succeed without errors
node bin/maamria-awb.js --version    # prints the new version
node bin/maamria-awb.js --help        # all commands listed
```

If you run automated tests, add them here.

## 3. CHANGELOG / release notes ready

Write what changed since the last published version. Tag the release on GitHub afterwards so it's discoverable.

```bash
git log $(npm pkg get version --json | tr -d '"')..HEAD --oneline
```

## 4. Bump the version

Pick `patch | minor | major` per [SemVer](https://semver.org/):

```bash
npm version patch     # 0.1.0 → 0.1.1
# or
npm version minor     # 0.1.0 → 0.2.0
# or
npm version major     # 0.1.0 → 1.0.0
```

`npm version` does three things:
- updates `package.json` and `package-lock.json`
- creates a git commit `v0.1.1`
- creates a git tag `v0.1.1`

## 5. Inspect what will ship

Always run a dry-run before the real publish.

```bash
npm pack --dry-run
```

Confirm the listed files contain `bin/`, `dist/`, `README.md`, `docs/`, and **nothing sensitive** (no `.env`, no `node_modules`, no `.git`, no source maps unless intended).

If something unexpected is included, fix the `files` field in `package.json` and/or add a `.npmignore`.

## 6. Pick a channel and follow its guide

- npm — [`npm.md`](./npm.md)
- pnpm — [`pnpm.md`](./pnpm.md)
- Homebrew (optional, after npm) — [`homebrew.md`](./homebrew.md)

## 7. Push commit + tag

```bash
git push origin main
git push origin --tags
```

## 8. Smoke-test from a clean machine

```bash
# in a fresh directory, no link, no global install of older version
mkdir -p /tmp/awb-smoke && cd /tmp/awb-smoke
npm install -g @maamria/awb@latest
maamria-awb --version       # matches the version you just published
maamria-awb status
```

If you skipped this and shipped a broken release, deprecate it immediately:

```bash
npm deprecate @maamria/awb@<bad-version> "Broken release — use <next-version>+"
```

Never `npm unpublish` a version that's been live > 72h — npm policy forbids it and existing users break instantly.
