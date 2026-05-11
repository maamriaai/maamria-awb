# Maamria-AWB — AI Context Builder for Claude Code, Copilot, Cursor & ChatGPT Projects

> **By [Maamria AI Workspace Builder](https://maamria.com).** Generate a clean, AI-ready workspace — `CLAUDE.md`, `.claude/agents`, `.claude/skills`, slash commands, assistant rules — for any project, in seconds, from your terminal.

> 🌐 **Prefer the browser?** You can also build the same workspace online at **[https://maamria.com/tools/ai-workspace-builder](https://maamria.com/tools/ai-workspace-builder)** — no CLI required. Step through the wizard, download the generated `.zip`, and copy the files into your project.

[![npm](https://img.shields.io/badge/npm-%40maamria%2Fawb-cb3837?logo=npm)](https://www.npmjs.com/package/@maamria/awb)
[![license](https://img.shields.io/badge/license-MIT-blue.svg)](./LICENSE)
[![node](https://img.shields.io/badge/node-%3E%3D18-brightgreen.svg)](https://nodejs.org)
[![status](https://img.shields.io/badge/status-active-success.svg)](#roadmap)
[![PRs](https://img.shields.io/badge/PRs-welcome-ff69b4.svg)](./CONTRIBUTING.md)

```bash
npm install -g @maamria/awb
maamria-awb login
maamria-awb init
```

<p align="center">
  <img src="./img/screenshot-1.png" alt="Maamria-AWB running in the terminal — interactive wizard generating an AI workspace" width="100%" />
  <br />
  <sub><em>The interactive <code>maamria-awb init</code> wizard — pick your assistant, project type, tech stack, rules, agents, and skills, then watch the workspace files land in your project.</em></sub>
</p>

---

## Why this exists

Most developers start using **Claude Code, GitHub Copilot, Cursor, Windsurf, or ChatGPT Projects** without giving the assistant enough project context. The AI then:

- reads files it shouldn't,
- misunderstands the architecture,
- burns tokens scanning vendored code and build artefacts,
- modifies the wrong things,
- contradicts decisions made last week.

`maamria-awb` solves this by generating a **clean AI-ready workspace** — context files, rules, agents, skills, and slash commands — *before* the assistant starts working. You get faster, cheaper, more predictable AI-assisted development.

## What the CLI generates

When you run `maamria-awb init`, the wizard collects:

- **Assistant** — Claude Code, GitHub Copilot, Cursor, Windsurf, ChatGPT Project (Claude Code is the mature output today; others on the [roadmap](./ROADMAP.md)).
- **Project type & tech stack** — searched live against the Maamria AI catalog.
- **Behavior mode** — Safe / Startup / Enterprise.
- **Rules, agents, skills, slash commands** — multi-select from the catalog.
- **Project name, description, language.**

It then writes the files into your project directory. Today's Claude Code output looks like:

```
your-project/
├── CLAUDE.md                          # canonical instructions for the assistant
├── SOURCES.md                         # references and curated reading list
├── .claude/
│   ├── settings.json                  # context-protection denies, env defaults
│   ├── agents/<agent>.md              # one file per selected agent
│   ├── skills/<skill>/SKILL.md        # one folder per selected skill
│   ├── commands/<command>.md          # one file per slash command
│   └── rules/<rule>.md                # behaviour-mode rules
└── .maamria-backups/<timestamp>/      # any files we replaced (only if conflicts)
```

The wizard never writes outside the project root. Existing files prompt you to **overwrite / skip / backup** before being touched.

## Without vs. with `maamria-awb`

| 🔴 Without Maamria-AWB | ✅ With Maamria-AWB |
|---|---|
| 🔴 AI assistant starts without clear project context | ✅ AI assistant receives structured project context before coding |
| 🔴 More token waste because the assistant scans unnecessary files | ✅ Less token waste — the assistant knows what matters |
| 🔴 Higher risk of modifying the wrong files | ✅ Project rules and boundaries protect the codebase |
| 🔴 Inconsistent coding style across AI sessions | ✅ Consistent instructions, rules, and workflows |
| 🔴 Manual setup for `CLAUDE.md`, agents, skills, commands | ✅ Automatic generation from one CLI workflow |
| 🔴 Harder onboarding for new contributors | ✅ Documented project structure ready on day one |
| 🔴 AI may ignore architecture decisions | ✅ Architecture and constraints are written clearly |
| 🔴 Repeated explanations in every AI session | ✅ Reusable context files live inside the project |
| 🔴 Messy or incomplete assistant instructions | ✅ Clean, structured, AI-ready workspace |
| 🔴 Less control over AI coding behavior | ✅ Predictable AI-assisted development |

## Benefits at a glance

- **Save setup time** — one wizard, dozens of files generated.
- **Reduce token usage** — context-protection denies rule out vendored / built code.
- **Avoid irrelevant file scanning** — the assistant skips what doesn't help.
- **Improve AI code quality** — clearer rules, fewer surprises.
- **Standardise AI instructions across a team** — one workspace, shared by everyone.
- **Make Claude Code, Copilot & Cursor more project-aware** — they read your project's intent, not just its bytes.
- **Reduce repeated explanations** — what you'd say at the start of every session is already in the files.
- **Easier onboarding** — new contributors get a documented baseline.
- **Safer AI-assisted development** — backups, path-traversal rejection, clear conflict prompts.
- **Open source** — MIT-licensed, contributions welcome.

## Installation

```bash
npm install -g @maamria/awb
# or
pnpm add -g @maamria/awb
```

Verify:

```bash
maamria-awb --version
```

If `command not found` after install, see [`docs/global-install.md`](./docs/global-install.md) for `npm link`, PATH, alias, and Homebrew options (zsh + bash).

## Usage

### 1. Create an API key on the Maamria AI dashboard

Log in at <https://maamria.com>, open **Profile → API Keys**, and click **New API Key**. Copy the key once — you won't see it again.

### 2. Connect the CLI

```bash
maamria-awb login
# paste your key when prompted (input is hidden)
```

The key is stored at the OS user-config path (e.g. `~/Library/Preferences/maamria-ai/config.json` on macOS) — **never** inside your project directory.

### 3. Quick generate (one command, non-interactive)

When you already know what you want, skip the wizard. Pass flags to `generate` and the CLI fetches recommendations, generates the workspace, and writes the files in a single command — perfect for CI, scripts, and repeatable team setups.

```bash
cd ~/projects/my-app
maamria-awb generate \
  --assistant claude-code \
  --project-type saas \
  --stack fastapi,vue-nuxt \
  --mode enterprise \
  --project-name "My API" \
  --description "FastAPI and Vue SaaS project" \
  --output . \
  --yes
```

How it works:

1. Reads the flags you passed (assistant, project type, stack, mode, project name, …).
2. Calls `/cli/recommend` to fetch backend recommendations for your stack.
3. Keeps only `default_selected` recommendations. Suggested ones are opt-in via `--include-suggestions` or `--interactive-recommendations`.
4. Calls `/cli/generate` to produce the workspace files.
5. Writes files safely with the same writer as `init`. Existing files are **skipped** unless `--force` is passed.

Common flags:

| Flag | Purpose |
|---|---|
| `--assistant` | Target AI assistant (`claude-code`, `cursor`, `copilot`, …) |
| `--project-type` | Project category (`saas`, `library`, `mobile`, …) |
| `--stack` | Comma-separated tech stack (`fastapi,vue-nuxt`) |
| `--mode` | Behavior mode (`starter`, `standard`, `enterprise`) |
| `--rules` | Comma-separated rule packs to include |
| `--project-name` | Human-readable project name |
| `--description` | Short project description |
| `--output` | Output directory (defaults to current folder) |
| `--language` | Output language for generated docs |
| `--include-suggestions` | Also include backend suggested recommendations |
| `--interactive-recommendations` | Pick recommendations one by one |
| `--dry-run` | Print what would be generated; **does not** call generate, does not write files |
| `--preview` | Show generated files without writing them (may still create a generation in history) |
| `--force` | Overwrite existing files (required to replace anything) |
| `--yes` | Accept all prompts. **Does not imply `--force`** — existing files are still skipped |
| `--no-interactive` | Fail instead of falling back to prompts if a value is missing |

More examples:

```bash
# Dry run — no API call to generate, no files written
maamria-awb generate \
  --assistant claude-code \
  --project-type saas \
  --stack fastapi,vue-nuxt \
  --mode enterprise \
  --project-name "My API" \
  --dry-run \
  --no-interactive

# Preview the generated files before writing
maamria-awb generate \
  --assistant claude-code \
  --project-type saas \
  --stack fastapi,vue-nuxt \
  --preview

# CI / scripted run — fully non-interactive, allowed to overwrite
maamria-awb generate \
  --assistant claude-code \
  --project-type saas \
  --stack fastapi,vue-nuxt \
  --mode enterprise \
  --project-name "My API" \
  --yes \
  --force \
  --no-interactive
```

> **Safety:** `--yes` never overwrites existing files by itself. Existing files are skipped unless you explicitly pass `--force`. `--dry-run` does not call generate and writes nothing. `--preview` shows generated files but may still create a generation in history if it uses `/cli/generate`.

Backward compatible:

- `maamria-awb generate` with **no flags** still opens the interactive wizard, just like `init`.
- `maamria-awb generate -y` still behaves like the old interactive flow with “yes to all”.
- The new non-interactive mode activates **only when flags are passed**.

### 4. Interactive wizard with `init`

Prefer being walked through it? `init` opens the same wizard as the web app, in your terminal.

```bash
cd ~/projects/my-app
maamria-awb init
```

The wizard walks you through assistant → project type → tech stack → mode → rules → agents → skills → commands → details → confirm. Files land in the current directory.

### 5. Other commands

```bash
maamria-awb status         # who am I logged in as?
maamria-awb config         # show API URL + config file path
maamria-awb logout         # remove the saved key from this machine
```

Every command supports `--help`.

## Local development mode

Working on the CLI itself, or testing against your local backend?

```bash
git clone https://github.com/maamriaai/maamria-awb.git maamria-awb
cd maamria-awb
npm install

# point at the local backend (the CLI never auto-prefixes /v1)
export MAAMRIA_API_URL=http://127.0.0.1:8010/v1

./bin/dev.sh login
./bin/dev.sh init
```

`bin/dev.sh` runs the TypeScript source through `tsx` — no build step needed. Full guide: [`docs/dev-setup.md`](./docs/dev-setup.md).

## Configuration

| Setting | Default | Override |
|---|---|---|
| API base URL | _placeholder — see below_ | `MAAMRIA_API_URL` env var, or `maamria-awb config --set apiUrl <url>` |
| API key | (from `login`) | `MAAMRIA_API_KEY` env var, or `--api-key <key>` flag |

The base URL is treated as the **single source of truth** — the CLI does **not** add `/v1` itself.

> **Heads-up:** the compiled-in default URL is a placeholder for a future hosted endpoint that is **not deployed yet**. Until the public production proxy ships, point the CLI directly at the FastAPI backend you can reach. For the open-source backend in this repo that means:
>
> ```bash
> # local backend on port 8010
> export MAAMRIA_API_URL=http://127.0.0.1:8010/v1
>
> # or whichever URL your team has deployed the FastAPI app at — include /v1
> maamria-awb config --set apiUrl https://your-deploy.example.com/v1
> ```
>
> The CLI will follow whatever you set; nothing in `@maamria/awb` is hard-locked to `maamria.com`. Details and full mode walk-through in [`docs/config.md`](./docs/config.md).

## Security

- Raw API keys are **hashed (SHA-256)** before being stored on the server. The server never has the plaintext key after creation.
- The CLI **never prints the full key** after login (status shows only `maamria_sk_aB3kQp••••T230`).
- Keys travel in `Authorization: Bearer <key>` — never in request bodies, never in URLs.
- Generated workspace files **never** contain your API key.
- Revoking a key from the dashboard **immediately** invalidates it on the next CLI request.
- Generated paths are validated server-side **and** client-side against `..`, absolute paths, drive letters, NUL bytes — the CLI refuses to write outside the project root.

Threat model and full key lifecycle in [`SECURITY.md`](./SECURITY.md) and [`docs/security.md`](./docs/security.md).

## Documentation

- [`docs/dev-setup.md`](./docs/dev-setup.md) — run locally without publishing.
- [`docs/global-install.md`](./docs/global-install.md) — make `maamria-awb` callable in every shell.
- [`docs/architecture.md`](./docs/architecture.md) — package layout, design choices.
- [`docs/commands.md`](./docs/commands.md) — every command, every flag.
- [`docs/api-contract.md`](./docs/api-contract.md) — backend ↔ CLI HTTP contract.
- [`docs/config.md`](./docs/config.md) — config file paths, env vars, modes.
- [`docs/security.md`](./docs/security.md) — threat model, key lifecycle.
- [`docs/troubleshooting.md`](./docs/troubleshooting.md) — symptom → fix table.
- [`docs/deploy/`](./docs/deploy/README.md) — publishing to npm, pnpm, Homebrew.
- [`docs/open-source-growth.md`](./docs/open-source-growth.md) — how to help the project grow.

## Roadmap

A high-level overview lives in [`ROADMAP.md`](./ROADMAP.md). Highlights:

- **Phase 1 (current)** — Stable CLI: login, init, status, logout, config; secure local storage; API-key auth.
- **Phase 2 (in progress)** — Full assistant-specific outputs: GitHub Copilot, Cursor, Windsurf, ChatGPT Project. (Claude Code shipped today.)
- **Phase 3** — Team workflow: shared workspace templates, team rules, reusable profiles.
- **Phase 4** — Advanced generation: custom agents/skills, project-specific workflows, backend-recommended presets.
- **Phase 5** — Ecosystem: Homebrew formula, framework integrations, community templates marketplace.

## Contributing

Pull requests, issues, and template contributions are welcome. Start with [`CONTRIBUTING.md`](./CONTRIBUTING.md) — it covers cloning, the dev loop, commit style, and the PR checklist. Beginners welcome.

Other useful entry points:

- [`CHANGELOG.md`](./CHANGELOG.md) — what changed in each release.
- [`CODE_OF_CONDUCT.md`](./CODE_OF_CONDUCT.md) — how we collaborate.
- [`SECURITY.md`](./SECURITY.md) — how to report a security issue privately.
- Issue templates: [bug report](./.github/ISSUE_TEMPLATE/bug_report.md) · [feature request](./.github/ISSUE_TEMPLATE/feature_request.md) · [docs improvement](./.github/ISSUE_TEMPLATE/documentation.md).

## License

MIT © [Maamria](https://maamria.com). See [`LICENSE`](./LICENSE).
