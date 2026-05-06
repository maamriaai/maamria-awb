# Deploying `@maamria/awb`

Step-by-step guides for publishing the CLI to each distribution channel.

| Channel | When to use it | Doc |
|---|---|---|
| **npm** | Default. Anyone running `npm install -g @maamria/awb` gets the latest. | [`npm.md`](./npm.md) |
| **pnpm** | Same registry as npm — only differs in the publishing tool. Use this if your release workflow already runs on pnpm. | [`pnpm.md`](./pnpm.md) |
| **Homebrew** | Optional. macOS / Linux users who prefer `brew install maamria-awb` over global npm installs. Wraps the npm package. | [`homebrew.md`](./homebrew.md) |

Read [`release-checklist.md`](./release-checklist.md) before **every** release — it's the short list of things that *must* be true before you hit publish.

## Recommended order for a new release

1. Pass the [`release-checklist.md`](./release-checklist.md).
2. Publish to **npm** ([npm.md](./npm.md)) — this is the source of truth. The Homebrew formula reuses the npm tarball, so npm goes first.
3. (Optional) Update the **Homebrew** formula ([homebrew.md](./homebrew.md)) so brew users get the same version.

`pnpm` and `npm` publish to the same registry — pick one for any given release; you don't need both.

## Versioning

Follow [SemVer](https://semver.org/):

- **patch** (`0.1.0 → 0.1.1`) — bug fixes only, no behavior change for valid input.
- **minor** (`0.1.0 → 0.2.0`) — new commands / flags / wizard steps. Backwards-compatible.
- **major** (`0.1.0 → 1.0.0`) — breaking changes (renamed commands, removed flags, schema-breaking payload changes vs. the backend).

Bump the version with `npm version <patch|minor|major>` (it updates `package.json` and creates a git tag). See the per-channel docs for the rest.

## Prerequisites — once per machine

```bash
# Node 18+
node -v

# npm or pnpm logged in and pointed at the public registry
npm whoami           # should print your npm user
# or
pnpm whoami

# (Optional) GitHub CLI for tagging / creating releases
gh auth status

# (Homebrew only) GitHub repo for your tap
gh repo view maamria/homebrew-tap >/dev/null && echo "tap exists"
```
