# Publishing with pnpm

`pnpm publish` writes to **the same npm registry** as `npm publish`. The only differences are the CLI you run and a few defaults. Use this if your release pipeline is already pnpm-based, or if you prefer it.

> Run through [`release-checklist.md`](./release-checklist.md) before this guide.
> The one-time setup (scope, 2FA, tokens) is identical to [`npm.md`](./npm.md) §1 — read that first if you haven't.

## 1. Authenticate

```bash
pnpm login --registry https://registry.npmjs.org
# → user / password / OTP if 2FA is on
pnpm whoami
# → your-npm-username
```

## 2. Pre-publish inspection

```bash
cd maamria-awb
pnpm install                      # populate node_modules + pnpm-lock.yaml
pnpm publish --dry-run --access public
```

Same idea as `npm pack --dry-run` — confirm only the right files ship.

## 3. Bump the version

```bash
cd maamria-awb
pnpm version patch                # or minor / major
# pnpm version creates a git commit and tag, just like npm version
```

## 4. Publish

```bash
pnpm publish --access public
# OTP prompt if 2FA is on
```

For staged releases use a dist-tag:

```bash
pnpm publish --tag next --access public
# promote later with npm:
npm dist-tag add @maamria/awb@0.2.0 latest
```

(`pnpm` doesn't yet have a first-class `dist-tag add` command — that's why the promote line uses `npm`. The registry doesn't care which CLI talks to it.)

## 5. Verify

```bash
pnpm view @maamria/awb
pnpm view @maamria/awb versions

# clean install
mkdir -p /tmp/awb-smoke && cd /tmp/awb-smoke
pnpm add -g @maamria/awb@latest
maamria-awb --version
```

## 6. Push tags

```bash
cd maamria-awb
git push origin main --follow-tags
```

## 7. Notes specific to pnpm

- **`prepublishOnly` runs the same way** as it does with `npm`. If you've set `"prepublishOnly": "npm run build"`, switch the command name to `pnpm run build` is *not* needed — the script body runs in whatever shell pnpm spawns, and `npm run` resolves to the package's local bin. Either name works.
- **Workspaces.** If `maamria-awb` is part of a pnpm workspace (it is, via `front/pnpm-workspace.yaml`), publish from inside the package directory:
  ```bash
  cd maamria-awb
  pnpm publish --access public
  ```
  not from the workspace root, otherwise pnpm tries to publish every workspace package.
- **Filtering from monorepo root.** If you do prefer to invoke from root:
  ```bash
  pnpm --filter @maamria/awb publish --access public
  ```
- **Frozen lockfile.** `pnpm install --frozen-lockfile` in CI guarantees the lockfile committed at the bumped version is what gets used.

## 8. CI publish with pnpm

`.github/workflows/release-pnpm.yml`:

```yaml
name: Publish (pnpm)
on:
  push:
    tags: ['v*']

jobs:
  publish:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      id-token: write
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
        with:
          version: 9
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          registry-url: 'https://registry.npmjs.org'
      - run: pnpm --filter @maamria/awb install --frozen-lockfile
      - run: pnpm --filter @maamria/awb run build
      - run: pnpm --filter @maamria/awb publish --access public --no-git-checks
        env:
          NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}
```

`--no-git-checks` is needed in CI because the runner's checkout is detached HEAD; pnpm refuses to publish from a non-clean tree without it. Keep it OFF for local publishes so you don't accidentally ship local edits.

## 9. Common errors

| Error | Fix |
|---|---|
| `ERR_PNPM_PUBLISH_GIT_BRANCH_NOT_ALLOWED` | You're on a non-publish branch. Switch to `main` or pass `--no-git-checks` (CI only). |
| `ERR_PNPM_PUBLISH_NO_GIT_TAG` | Run `pnpm version <bump>` first, or skip with `--no-git-checks`. |
| `403 Forbidden` first time | Use `--access public` for public scoped packages. |
| `EOTP` | Add OTP via `--otp 123456` or use an automation token. |
