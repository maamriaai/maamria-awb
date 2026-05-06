# Roadmap

This roadmap reflects the current direction. Dates are intentionally absent — we ship when the work is good. Anything not listed here is open for community proposal via [feature requests](./.github/ISSUE_TEMPLATE/feature_request.md).

Status legend: ✅ shipped · 🚧 in progress · 📋 planned · 💡 idea

## Phase 1 — Stable CLI foundation ✅

Foundation work that's already in `0.x`.

- ✅ `login` — interactive API-key entry, server-side validation, secure local storage.
- ✅ `logout` — clear the saved key without affecting other config.
- ✅ `status` — show identity + API URL, masked key only.
- ✅ `init` / `generate` — interactive wizard, generation, conflict-aware file writing with backups.
- ✅ `config` — show / set the API URL.
- ✅ Local config (OS user-config dir, never the project folder).
- ✅ API-key validation against the backend before saving.
- ✅ Secure local storage (`conf`, user-only permissions).
- ✅ Path-safety: client- and server-side rejection of `..`, absolute paths, drive letters.

## Phase 2 — Assistant-specific outputs 🚧

Today **Claude Code** is the mature output (`CLAUDE.md`, `.claude/agents`, `.claude/skills`, `.claude/commands`, `.claude/rules`, `.claude/settings.json`, `SOURCES.md`).

The other assistants are wizard inputs already; their full file generators are next.

- ✅ Claude Code workspace files (CLAUDE.md, agents, skills, commands, rules, settings.json, SOURCES.md).
- 🚧 GitHub Copilot instructions (`.github/copilot-instructions.md`, repo-level rules).
- 📋 Cursor rules (`.cursorrules`, `.cursor/rules/*.md`).
- 📋 Windsurf rules (`.windsurfrules`, profile templates).
- 📋 ChatGPT Project instructions (Markdown bundle suitable for the Project's "Instructions" field).
- 📋 Multi-target generation in a single `init` (pick more than one assistant; emit all relevant files).

## Phase 3 — Team workflow 📋

Once individual generation is solid, scale it to teams.

- 📋 Shared workspace templates (private team templates pulled from the Maamria AI account).
- 📋 Team rules — apply organisation-wide policies on top of project rules.
- 📋 Reusable profiles — "Saas Backend", "Mobile App", "Data Pipeline", saved per workspace and per team.
- 📋 Project presets — a one-shot `maamria-awb init --preset saas-fastapi-vue` that skips the wizard.
- 💡 Team API-key audit log — surface in the dashboard which keys ran which generations.

## Phase 4 — Advanced generation 📋

Power features for users who outgrow the defaults.

- 📋 Custom agents — define agents inline and have `init` emit their `.claude/agents/*.md`.
- 📋 Custom skills — same for skills.
- 📋 Custom slash commands — generate `.claude/commands/*.md` from a YAML or JSON spec.
- 📋 Project-specific workflows — pre-canned multi-step prompts (`/feature-dev`, `/build-fix`).
- 💡 Backend-recommended presets — the API suggests rules / agents / skills based on detected stack.
- 💡 Context-protection learner — the API learns common ignore patterns from the community and suggests them.

## Phase 5 — Ecosystem 📋

Make the project easier to discover, install, and extend.

- 🚧 npm publishing — automated via GitHub Actions on `v*` tags, with `--provenance`. ([`docs/deploy/npm.md`](./docs/deploy/npm.md))
- 📋 Homebrew formula — `brew install maamriaai/tap/maamria-awb`. ([`docs/deploy/homebrew.md`](./docs/deploy/homebrew.md))
- 📋 Templates marketplace — community templates browsable from the CLI (`maamria-awb templates`).
- 📋 Community templates contribution flow — PR a template to a public repo, automatic publish on merge.
- 📋 Framework integrations — first-party templates for Next.js, Nuxt, FastAPI, Django, NestJS, etc.
- 💡 VS Code extension — surface AWB inside the editor.

## How to influence the roadmap

- **Open a feature request.** ([template](./.github/ISSUE_TEMPLATE/feature_request.md))
- **Show interest with 👍 reactions** on existing issues — that's the signal we use to prioritise.
- **Submit a PR.** Even a draft against an in-progress item is welcome; we'll iterate together.

See [`docs/open-source-growth.md`](./docs/open-source-growth.md) for ways to contribute beyond code.
