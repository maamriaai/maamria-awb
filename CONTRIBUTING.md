# Contributing to Maamria-AWB

Thanks for your interest in improving `@maamria/awb`. This document is the practical guide — clone, run, change, test, submit. Beginners welcome.

By contributing you agree to follow our [Code of Conduct](./CODE_OF_CONDUCT.md).

## Quick start

```bash
git clone https://github.com/maamriaai/maamria-awb.git maamria-awb
cd maamria-awb
npm install
export MAAMRIA_API_URL=http://127.0.0.1:8010/v1   # if you have a local backend
./bin/dev.sh status
```

That's it. You're ready to hack on the CLI.

## What can I work on?

- Browse [open issues](https://github.com/maamriaai/maamria-awb/issues). Anything labelled `good-first-issue` is sized for a first PR.
- Improving documentation is always valuable — typos, broken links, unclear sections, missing examples.
- New assistant integrations (Cursor / Windsurf / Copilot output) — see [`ROADMAP.md`](./ROADMAP.md) for what's planned.
- Workspace templates and community presets — see [`docs/open-source-growth.md`](./docs/open-source-growth.md).

If you want to work on something larger, **open an issue first** so we can align on direction before you write code.

## Project layout

```
maamria-awb/
├── bin/                    # Node entry script + dev wrapper
├── src/
│   ├── index.ts            # commander setup
│   ├── api/                # axios client + wire types
│   ├── commands/           # one file per CLI command
│   ├── config/             # persisted settings
│   ├── prompts/            # interactive wizard + multi-select picker
│   ├── writer/             # safe-path checks + file writer
│   └── utils/              # banner, version, logging
├── docs/                   # in-depth docs
└── package.json
```

A deeper dive lives in [`docs/architecture.md`](./docs/architecture.md).

## Local development loop

There are several equivalent ways to run the CLI from source — pick one:

```bash
./bin/dev.sh login           # auto-installs deps if needed, then runs via tsx
npm run cli -- login         # the trailing -- passes args through
npx tsx src/index.ts login   # tsx directly
node bin/maamria-awb.js login
```

To make changes feel instant, run the watcher:

```bash
npm run watch                # tsc --watch (rebuilds dist/ on save)
# or just keep using ./bin/dev.sh — it always reads the latest src/
```

Full setup notes: [`docs/dev-setup.md`](./docs/dev-setup.md).

## Testing your changes

There's no automated test suite yet — that's on the roadmap, contributions welcome. For now, the manual loop is:

1. **Type-check + build:** `npm run build`. Must succeed without errors.
2. **Smoke `--help` / `--version`:** `node bin/maamria-awb.js --help` lists every command; `--version` matches `package.json`.
3. **Connectivity:** `./bin/dev.sh status` against your dev or prod backend prints the logged-in email.
4. **Wizard end-to-end:** in a throwaway directory, run `./bin/dev.sh init` and step through the wizard. Files should land in `cwd`; existing files should prompt for overwrite/skip/backup.
5. **Path safety:** if your change touches `src/writer/`, try a generation that includes a deeply nested file and verify backups land under `.maamria-backups/<timestamp>/`.

If you add a new command, document it in [`docs/commands.md`](./docs/commands.md).

If you change the wire format, update [`docs/api-contract.md`](./docs/api-contract.md) and `src/api/types.ts`.

## Commit style

We follow short, imperative messages. Prefix with the area when it helps:

```
fix(searchSelect): persist multi-round selections by slug
docs(deploy): add Homebrew tap walkthrough
feat(init): support --output for non-CWD generation
```

Conventional Commits are recommended but not enforced — clarity matters more than rigour. Keep the subject under ~70 characters; put detail in the body when it helps reviewers.

## Pull requests

1. Fork the repo, create a branch from `main`: `git checkout -b feat/cursor-output`.
2. Make your changes. Keep diffs focused — one feature or fix per PR.
3. Update docs and `CHANGELOG.md` (under `## [Unreleased]`).
4. Run `npm run build` — type-check must pass.
5. Push and open a PR against `main`. Fill out the PR template; the checklist is short on purpose.
6. A maintainer will review. We aim for first response within a few days. Iteration is normal — please don't be discouraged.

The PR template lives at [`.github/PULL_REQUEST_TEMPLATE.md`](./.github/PULL_REQUEST_TEMPLATE.md).

## Code quality expectations

The repo enforces a few simple norms via [`.claude/rules/`](./.claude/rules/) (yes, the CLI uses its own output for context):

- **Keep functions small** — under ~50 lines is a good default.
- **Files focused** — under ~400 lines is normal; ~800 is the upper limit.
- **No deep nesting** — prefer early returns once you're past 4 levels.
- **No magic numbers** — name your thresholds.
- **No silent error swallowing** — log or surface meaningful errors.
- **No mutation of shared structures** — return new objects.
- **Validate at boundaries** — never trust HTTP responses, environment variables, or user input without checking.
- **No hardcoded secrets** — ever.

These are guidelines, not gates. Reviewers may ask you to apply them; we'll explain why when we do.

## Documentation expectations

- New behaviour → update or add a doc in [`docs/`](./docs/) and link it from [`docs/README.md`](./docs/README.md).
- New command or flag → entry in [`docs/commands.md`](./docs/commands.md).
- New env var, config field, or default → mention in [`docs/config.md`](./docs/config.md).
- Wire-format change → reflect it in [`docs/api-contract.md`](./docs/api-contract.md) and `src/api/types.ts`.
- User-visible change → one-line entry in [`CHANGELOG.md`](./CHANGELOG.md) under `## [Unreleased]`.

If you're unsure where something belongs, open the PR anyway and ask in the description — we'd rather review and route than have the change sit in your branch.

## Reporting issues

- **Bug?** Use [bug report](./.github/ISSUE_TEMPLATE/bug_report.md). Please include CLI version, Node version, OS, and the exact command you ran. **Never paste API keys** in issue logs.
- **Idea?** Use [feature request](./.github/ISSUE_TEMPLATE/feature_request.md). Tell us the problem, not just the solution — alternatives matter.
- **Docs unclear?** Use [documentation](./.github/ISSUE_TEMPLATE/documentation.md).
- **Security?** **Don't open a public issue.** See [`SECURITY.md`](./SECURITY.md) for the private channel.

## Releasing (maintainers)

The full process is in [`docs/deploy/release-checklist.md`](./docs/deploy/release-checklist.md). In short:

```bash
npm version patch        # or minor / major
git push --follow-tags
npm publish --access public
```

Then bump the Homebrew formula if applicable.

---

Thank you. Even a typo fix is a real contribution.
