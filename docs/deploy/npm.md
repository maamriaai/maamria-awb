# Publishing to npm

This is the canonical channel. Anyone running `npm install -g @maamria/awb` reads from npmjs.com.

> Run through [`release-checklist.md`](./release-checklist.md) before this guide.

## 1. One-time setup

### 1.1 Create / claim the npm scope

`@maamria/awb` is a **scoped** package. The scope `@maamria` must exist on npmjs.com and your user must belong to it.

1. Go to https://www.npmjs.com/signup (skip if you already have a user).
2. Create the org: https://www.npmjs.com/org/create — pick **Free** unless you need private packages. Org name: `maamria`.
3. Add team members under https://www.npmjs.com/settings/maamria/members.

Verify from the terminal:

```bash
npm whoami
# → your-npm-username

npm org ls maamria
# should list you
```

### 1.2 Enable 2FA (strongly recommended)

```bash
npm profile enable-2fa auth-and-writes
```

Once enabled, every publish will prompt for an OTP. Worth it.

### 1.3 (Optional) Generate a publish token for CI

For GitHub Actions or another CI:

1. https://www.npmjs.com/settings/<you>/tokens/granular-access-tokens/new
2. Scope: write access to `@maamria/awb`.
3. Expiry: 90 days max.
4. Save the token into the repo's secrets as `NPM_TOKEN`.

Use `automation` token type if you have 2FA enabled — those tokens bypass OTP prompts.

## 2. Pre-publish — what npm sees

Open `maamria-awb/package.json` and double-check:

```jsonc
{
  "name": "@maamria/awb",       // scoped, lower-case
  "version": "0.1.0",            // bumped via `npm version`
  "description": "…",            // shown on npmjs.com
  "license": "MIT",
  "type": "module",
  "bin": {
    "maamria-awb": "./bin/maamria-awb.js",
    "maamria":     "./bin/maamria-awb.js"
  },
  "files": [                     // *only* these go in the tarball
    "bin",
    "dist",
    "README.md",
    "docs"
  ],
  "engines": { "node": ">=18" },
  "scripts": {
    "build":          "tsc",
    "prepublishOnly": "npm run build"   // npm runs this automatically
  }
}
```

Fields that are good to add before going public:

```jsonc
{
  "homepage":   "https://maamria.com",
  "repository": { "type": "git", "url": "https://github.com/maamriaai/maamria-awb.git" },
  "bugs":       { "url": "https://github.com/maamriaai/maamria-awb/issues" },
  "keywords":   ["claude-code", "ai", "cli", "workspace", "maamria"]
}
```

Inspect what will actually ship:

```bash
cd maamria-awb
npm pack --dry-run
```

The output lists every file. **Look for surprises** — `.env`, source maps, `node_modules/`, etc. If anything unwanted is in there, tighten the `files` array or add a `.npmignore` (npm prefers `files` over `.npmignore` — pick one).

## 3. Bump the version

```bash
cd maamria-awb
npm version patch        # or minor / major
# → committed as "v0.1.1" + tagged
```

## 4. Build (handled by `prepublishOnly`, but worth verifying)

```bash
npm run build
ls dist/                  # should contain index.js, commands/, api/, …
node bin/maamria-awb.js --version
```

## 5. Publish

```bash
npm publish --access public
# enter OTP if 2FA is enabled
```

`--access public` is **required** the first time on a new scoped package. After the first publish you can omit it, but it's safer to leave it in.

If you're testing the release pipeline without going public, use a dist-tag:

```bash
npm publish --tag next --access public
# users opt in via:  npm install -g @maamria/awb@next
```

Promote later:

```bash
npm dist-tag add @maamria/awb@0.2.0 latest
```

## 6. Verify

```bash
# the tarball should appear within seconds
npm view @maamria/awb
npm view @maamria/awb versions

# install it from a clean shell
mkdir -p /tmp/awb-smoke && cd /tmp/awb-smoke
npm install -g @maamria/awb@latest
maamria-awb --version
```

## 7. Push tags

```bash
cd maamria-awb
git push origin main --follow-tags
gh release create v0.1.1 --notes-file CHANGELOG.md   # if using GitHub
```

## 8. Recovering from a bad release

```bash
# preferred — keeps existing users running, warns new ones
npm deprecate @maamria/awb@0.1.1 "Broken release — please use 0.1.2+"

# absolute last resort, only within 72h of publish
npm unpublish @maamria/awb@0.1.1
```

Then publish a fixed `0.1.2` and `dist-tag add … latest`.

## 9. Continuous publishing (optional)

`.github/workflows/release.yml`:

```yaml
name: Publish to npm
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
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          registry-url: 'https://registry.npmjs.org'
      - run: cd maamria-awb && npm ci
      - run: cd maamria-awb && npm run build
      - run: cd maamria-awb && npm publish --access public --provenance
        env:
          NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}
```

`--provenance` (Node 18+) attaches a signed attestation that the package was built from this exact commit. Strongly recommended.

## 10. Common errors

| Error | Fix |
|---|---|
| `403 You cannot publish over the previously published versions` | You forgot `npm version` — bump it. |
| `402 Payment Required` (private scope) | Use `--access public`, or upgrade the org to paid. |
| `EOTP One-time password required` | Run again and enter your 2FA code, or use an `automation` token. |
| `Cannot find module 'tsx/esm/api'` after install | Users hit this when `prepublishOnly` didn't run. Verify `dist/` ships in `npm pack --dry-run`. |
| Empty `bin/` after install | The shebang `#!/usr/bin/env node` must be the very first line of `bin/maamria-awb.js`, no BOM. |
