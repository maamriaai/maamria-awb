# maamria-awb — Documentation

This folder contains the in-depth documentation for the **Maamria AI Workspace Builder CLI** (`@maamria/awb`).

For a quick overview, see the [package README](../README.md). For everything else, read the docs in roughly this order:

| Doc | What's inside |
|---|---|
| [`dev-setup.md`](./dev-setup.md) | **Run the CLI locally without publishing to npm.** Step-by-step dev setup. |
| [`global-install.md`](./global-install.md) | **Make `maamria-awb` available in any terminal / project.** zsh + bash, with five options. |
| [`architecture.md`](./architecture.md) | How the package is laid out — entry point, commands, prompts, writer, API client. |
| [`commands.md`](./commands.md) | Detailed reference for every command (`login`, `init`, `logout`, `status`, `config`). |
| [`api-contract.md`](./api-contract.md) | Backend ↔ CLI HTTP contract. Endpoints, payloads, error shapes. |
| [`config.md`](./config.md) | Where the CLI stores its config, env-var overrides, switching between dev / prod URLs. |
| [`security.md`](./security.md) | Threat model, hashing, key storage, what's logged and what isn't. |
| [`troubleshooting.md`](./troubleshooting.md) | Common errors and how to fix them. |
| [`deploy/`](./deploy/README.md) | **Production deploys** — npm, pnpm, Homebrew, release checklist. |
| [`open-source-growth.md`](./open-source-growth.md) | Ways to help the project grow — templates, integrations, docs, use cases. |

## Project-level files

These live at the repo root, not under `docs/`:

| File | Purpose |
|---|---|
| [`../README.md`](../README.md) | Public landing page — install, usage, comparison, roadmap. |
| [`../CONTRIBUTING.md`](../CONTRIBUTING.md) | How to clone, run, change, and submit a PR. |
| [`../CHANGELOG.md`](../CHANGELOG.md) | Per-release change log (Keep a Changelog format). |
| [`../ROADMAP.md`](../ROADMAP.md) | What's planned, what's in progress, what's done. |
| [`../SECURITY.md`](../SECURITY.md) | How to report a vulnerability privately. |
| [`../CODE_OF_CONDUCT.md`](../CODE_OF_CONDUCT.md) | Expected behaviour in project spaces. |
| [`../LICENSE`](../LICENSE) | MIT. |

## Environments

| Mode | Base URL | How to enable |
|---|---|---|
| **Production** (default) | `https://maamria.com/api-cli` | Nothing to do — this is the built-in default. |
| **Development** | `http://127.0.0.1:8010/v1` | `export MAAMRIA_API_URL=http://127.0.0.1:8010/v1` (or `maamria-awb config --set apiUrl http://127.0.0.1:8010/v1`). |

The CLI never injects a version segment of its own. The base URL **is** the prefix. In prod the reverse proxy at `/api-cli` forwards to the FastAPI router that's mounted under `/v1`; in dev you just point straight at the FastAPI app on port 8010 and include `/v1` yourself.

## Where things live

```
maamria-awb/
├── bin/
│   ├── maamria-awb.js   # production entry — runs dist/ if built, falls back to tsx
│   └── dev.sh           # convenience wrapper for ./bin/dev.sh login / status / init
├── src/
│   ├── index.ts          # commander setup, command registration
│   ├── api/
│   │   ├── client.ts     # axios + interceptors
│   │   └── types.ts      # shared wire types (mirrors backend Pydantic)
│   ├── config/store.ts   # conf-backed persisted settings
│   ├── commands/         # one file per CLI command
│   ├── prompts/          # interactive wizard + search-first multi-select
│   ├── writer/           # safe path checks + file writer with overwrite/backup
│   └── utils/logger.ts   # banner, info/success/warn/error helpers
└── docs/                 # ← you are here
```

## Quick test against the local backend

```bash
# in one terminal
cd back && uvicorn main:app --reload --port 8010

# in another
cd maamria-awb
npm install
export MAAMRIA_API_URL=http://127.0.0.1:8010/v1
./bin/dev.sh status         # should print "Not logged in"
./bin/dev.sh login          # paste a key created from /profile/api-keys
./bin/dev.sh status         # should now show your email
cd /tmp && mkdir test-proj && cd test-proj
~/maamria-awb/bin/dev.sh init
```

See [`dev-setup.md`](./dev-setup.md) for the full walk-through.
