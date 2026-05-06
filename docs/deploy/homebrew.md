# Publishing to Homebrew

Goal: `brew install maamriaai/tap/maamria-awb` (or eventually `brew install maamria-awb`) on macOS and Linux.

Homebrew doesn't host packages — it hosts **formulas** that describe how to fetch + install. The cleanest path for a Node CLI is:

1. **Publish to npm first** ([`npm.md`](./npm.md)). The Homebrew formula will download the tarball from `registry.npmjs.org`.
2. **Maintain your own tap** (a small GitHub repo Homebrew can install from). Submitting to `homebrew-core` is possible but has higher acceptance criteria — start with a personal tap.

> Skip this guide if your audience is fine with `npm install -g`. Homebrew adds value for users who don't have npm (or who already manage their dev tools through `brew bundle`).

## 1. Create the tap repository (one time)

A Homebrew tap is just a GitHub repo named `homebrew-<something>` that contains formula `.rb` files.

```bash
gh repo create maamriaai/homebrew-tap --public --description "Homebrew tap for Maamria AI tools"
git clone https://github.com/maamriaai/homebrew-tap.git
cd homebrew-tap
mkdir -p Formula
```

## 2. Compute the SHA-256 of the published npm tarball

Once `@maamria/awb@<version>` is published:

```bash
VERSION=0.1.0
URL="https://registry.npmjs.org/@maamria/awb/-/awb-${VERSION}.tgz"
curl -sL "$URL" -o /tmp/awb.tgz
shasum -a 256 /tmp/awb.tgz | awk '{print $1}'
# → 4b8e…c0f1
```

Keep that hash handy.

## 3. Write the formula

Create `Formula/maamria-awb.rb` in your tap:

```ruby
require "language/node"

class MaamriaAwb < Formula
  desc "Maamria AI Workspace Builder — generate AI workspace files from your terminal"
  homepage "https://maamria.com"
  url "https://registry.npmjs.org/@maamria/awb/-/awb-0.1.0.tgz"
  sha256 "REPLACE-WITH-THE-HASH-FROM-STEP-2"
  license "MIT"

  depends_on "node"

  def install
    system "npm", "install", *Language::Node.std_npm_install_args(libexec)
    bin.install_symlink Dir["#{libexec}/bin/*"]
  end

  test do
    assert_match "Maamria AI", shell_output("#{bin}/maamria-awb --version 2>&1", 0)
  end
end
```

Conventions worth knowing:

- **Class name** must be the CamelCase form of the file name. `maamria-awb.rb` ⇒ `MaamriaAwb`.
- **`url`** must point to the **exact** versioned tarball, not a "latest" link. Each new release needs an updated formula.
- **`sha256`** is the hash of *that* tarball. If `url` and `sha256` don't match, `brew install` aborts.
- **`depends_on "node"`** ensures Homebrew installs Node if missing.
- **`Language::Node.std_npm_install_args(libexec)`** is the standard incantation — Homebrew sets up an isolated `libexec` prefix and the symlinks point at it.

## 4. Validate before pushing

```bash
cd homebrew-tap
brew audit --strict --new-formula Formula/maamria-awb.rb
brew install --build-from-source ./Formula/maamria-awb.rb
maamria-awb --version
brew uninstall maamria-awb
```

If `brew audit` complains, fix and re-run. Common gripes:

- **License field** must be a valid SPDX identifier (`MIT`, `Apache-2.0`, …).
- **Description** can't start with "A " or end with a period.
- **Homepage** must be HTTPS.
- **Test block** must do something non-trivial — `--version` is acceptable.

## 5. Commit and push

```bash
git add Formula/maamria-awb.rb
git commit -m "maamria-awb 0.1.0"
git push origin main
```

## 6. Users install via the tap

```bash
brew tap maamriaai/tap
brew install maamria-awb
maamria-awb --version
```

Or in one line:

```bash
brew install maamriaai/tap/maamria-awb
```

`brew tap maamriaai/tap` resolves to the GitHub repo `maamriaai/homebrew-tap` automatically.

## 7. Updating to a new version

After every npm release:

```bash
NEW_VERSION=0.1.1
URL="https://registry.npmjs.org/@maamria/awb/-/awb-${NEW_VERSION}.tgz"
NEW_SHA=$(curl -sL "$URL" | shasum -a 256 | awk '{print $1}')

cd ~/path/to/homebrew-tap
sed -i '' -E "s|awb-[0-9]+\.[0-9]+\.[0-9]+\.tgz|awb-${NEW_VERSION}.tgz|g" Formula/maamria-awb.rb
sed -i '' -E "s|^  sha256 \".*\"|  sha256 \"${NEW_SHA}\"|"            Formula/maamria-awb.rb

brew audit --strict Formula/maamria-awb.rb
git commit -am "maamria-awb ${NEW_VERSION}"
git push origin main
```

(On Linux drop the empty `''` arg after `-i`.)

End-users update normally:

```bash
brew update
brew upgrade maamria-awb
```

## 8. Optional — `brew bump-formula-pr` automation

If you've contributed to homebrew-core before, the same automation works for taps:

```bash
brew bump-formula-pr \
  --url="https://registry.npmjs.org/@maamria/awb/-/awb-0.1.1.tgz" \
  --sha256="${NEW_SHA}" \
  maamriaai/tap/maamria-awb
```

It opens a PR against your tap with the version + sha256 bumped. Useful for CI integration with `peter-evans/create-pull-request` after each npm release.

## 9. CI: bump tap on every npm release

`.github/workflows/bump-homebrew.yml` (in the **CLI repo**, not the tap):

```yaml
name: Bump Homebrew tap
on:
  release:
    types: [published]      # GitHub release → bump tap

jobs:
  bump:
    runs-on: macos-latest
    steps:
      - uses: actions/checkout@v4
      - name: Compute hash
        id: hash
        run: |
          V="${GITHUB_REF_NAME#v}"
          curl -sL "https://registry.npmjs.org/@maamria/awb/-/awb-${V}.tgz" -o /tmp/t.tgz
          echo "sha=$(shasum -a 256 /tmp/t.tgz | awk '{print $1}')" >> $GITHUB_OUTPUT
          echo "version=${V}" >> $GITHUB_OUTPUT
      - name: Update tap
        uses: mislav/bump-homebrew-formula-action@v3
        with:
          formula-name: maamria-awb
          tap: maamriaai/homebrew-tap
          download-url: https://registry.npmjs.org/@maamria/awb/-/awb-${{ steps.hash.outputs.version }}.tgz
          download-sha256: ${{ steps.hash.outputs.sha }}
        env:
          COMMITTER_TOKEN: ${{ secrets.HOMEBREW_TAP_PAT }}
```

`HOMEBREW_TAP_PAT` is a fine-grained PAT with write access to the `maamriaai/homebrew-tap` repo only.

## 10. Submitting to homebrew-core (later, optional)

Only worth it once the package has a public following and stable release cadence. Requirements (abridged):

- 30+ GitHub stars on the source repo, **or** package available for ≥ 30 days.
- Public, signed releases.
- Stable name (no rename in the last 12 months).
- Open a PR to https://github.com/Homebrew/homebrew-core with the formula. Maintainers will review.

Until then, your own tap is fine — most successful CLIs (`gh`, `pnpm`'s installer, `bun`, `infisical`, …) started with a personal tap.

## 11. Common errors

| Error | Fix |
|---|---|
| `Error: SHA256 mismatch` | The `sha256` in the formula doesn't match the tarball at `url`. Recompute and update. |
| `command not found: maamria-awb` after install | Make sure `bin.install_symlink Dir["#{libexec}/bin/*"]` is in the formula. Without it, Homebrew installs into `libexec/bin` but doesn't link to `/usr/local/bin`. |
| `Invalid formula: missing "node"` | Add `depends_on "node"`. |
| `Error: Empty installation` | The npm package didn't ship a `bin/` — check `npm pack --dry-run` from the CLI repo and the published tarball on npm. |
| `Undefined method 'std_npm_install_args'` | Add `require "language/node"` at the top of the formula. |
