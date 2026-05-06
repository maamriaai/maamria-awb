# Changelog

All notable changes to `@maamria/awb` are documented here.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and this project follows [Semantic Versioning](https://semver.org/).

## [Unreleased]

### Added

- Open-source governance files: `LICENSE`, `CONTRIBUTING.md`, `SECURITY.md`, `CODE_OF_CONDUCT.md`, `ROADMAP.md`, `CHANGELOG.md`.
- GitHub templates: bug report, feature request, documentation, pull request.
- GitHub Actions CI workflow that runs install + build on every PR and push to `main`.
- Issue / PR labelling guidance via templates.
- `docs/open-source-growth.md` — how the community can contribute beyond code.

### Changed

- `README.md` rewritten as a public-facing landing page with strong title, before/after table, install/usage walk-through, security summary, and roadmap.
- `docs/README.md` index expanded with the new top-level documents.
- `package.json` metadata expanded — `description`, `repository`, `homepage`, `bugs`, `keywords`, `author`.

### Fixed

- _(none in this section yet)_

### Security

- _(no changes — see [`SECURITY.md`](./SECURITY.md) for the full security policy.)_

---

## [0.1.0] — 2026-05-06

Initial public preview.

### Added

- `login` — interactive API-key entry, server-side validation, secure local storage via `conf`.
- `logout` — wipe the saved API key from this machine.
- `status` — show the configured API URL, masked saved key, and the validated user identity.
- `init` (alias `generate`) — interactive wizard for assistant, project type, tech stack, behavior mode, rules, agents, skills, slash commands, project metadata. Generates Claude Code workspace files (`CLAUDE.md`, `.claude/agents`, `.claude/skills`, `.claude/commands`, `.claude/rules`, `.claude/settings.json`, `SOURCES.md`) into the current directory.
- `config` — show or set the API URL (`--set apiUrl <url>`).
- `--api-key` global flag and `MAAMRIA_API_KEY` env var override saved login per invocation.
- `MAAMRIA_API_URL` env var override. The compiled-in default is a placeholder for a future hosted endpoint; until that's deployed, the CLI requires `MAAMRIA_API_URL` to be set to a reachable FastAPI deployment (e.g. `http://127.0.0.1:8010/v1` for local dev).
- Hero banner in TTY mode; compact single-line form when output is piped.
- Live-filtering, paginated, multi-select picker for tech / agents / skills / commands (no more giant lists).
- Conflict-aware file writer: per-file overwrite / skip / backup, with bulk shortcuts. Backups land under `.maamria-backups/<timestamp>/`.
- Path-safety enforcement on **both** server and client (rejects `..`, absolute paths, NUL bytes, drive letters).
- Documentation: `dev-setup`, `global-install`, `architecture`, `commands`, `api-contract`, `config`, `security`, `troubleshooting`, `deploy/{README,npm,pnpm,homebrew,release-checklist}`.

### Security

- API keys are SHA-256 hashed before storage on the backend; raw keys never persisted.
- CLI never prints the full key after login; `status` shows only the masked form.
- Keys are sent only via `Authorization: Bearer <key>`, never in request bodies or URLs.
- Generated workspace files never contain the key.

[Unreleased]: https://github.com/maamriaai/maamria-awb/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/maamriaai/maamria-awb/releases/tag/v0.1.0
