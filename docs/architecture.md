# Architecture

## High-level flow

```
┌─────────────┐      Authorization: Bearer maamria_sk_…       ┌──────────────────────────┐
│  Terminal   │ ───────────────────────────────────────────▶  │   Maamria AI backend     │
│  user       │                                                │   FastAPI / MongoDB       │
│             │   {success, data: { files: [{path, content}]}} │                           │
│             │ ◀──────────────────────────────────────────── │   /v1/ai-workspace-       │
│  ./bin/     │                                                │      builder/cli/*        │
│  dev.sh     │                                                │   /v1/api-keys/*          │
└─────────────┘                                                └──────────────────────────┘
       │
       │ writes
       ▼
┌─────────────────────────────────┐
│  current project root           │
│  CLAUDE.md, .claude/agents/…    │
│  .maamria-backups/<ts>/…        │
└─────────────────────────────────┘
```

The CLI does three things:

1. **Auth** — sends `Authorization: Bearer <key>` to the backend; the backend resolves the key against `users.api_keys[]` (sha256 hash match).
2. **Wizard** — runs an interactive prompt cycle that mirrors the web wizard (assistant → project type → tech stack → mode → rules → agents → skills → commands → details).
3. **Write** — receives a flat list of `{path, content}` objects and writes them into the current project root, with overwrite/skip/backup handling.

It does **not** generate files itself; the backend's existing `AiWorkspaceBuilderHandler` is reused so the web flow and the CLI flow always emit identical output.

## Source layout

```
src/
├── index.ts              # commander setup; registers every command
├── api/
│   ├── client.ts         # axios instance, error normalization, every endpoint helper
│   └── types.ts          # wire types matching back/models/AiWorkspaceBuilder/*.py
├── config/store.ts       # conf-backed persisted config (apiUrl, apiKey)
├── commands/
│   ├── login.ts          # prompts → validates → saves
│   ├── logout.ts         # clears the saved key
│   ├── status.ts         # banner + masked key + /api-keys/validate ping
│   ├── init.ts           # wraps the wizard, calls /generate, hands off to writeFiles
│   └── config.ts         # show / set apiUrl
├── prompts/
│   ├── wizard.ts         # the assistant→…→details flow
│   └── searchSelect.ts   # search-first multi-select used for tech / agents / skills
├── writer/
│   ├── safePaths.ts      # rejects ../, absolute paths, drive letters, NUL bytes
│   └── writeFiles.ts     # ensures directories, prompts on conflicts, manages backups
└── utils/
    └── logger.ts         # banner, info/success/warn/error, maskKey
```

## Module boundaries

| From | Imports | Why |
|---|---|---|
| `commands/*` | `api/`, `prompts/`, `writer/`, `utils/`, `config/` | Each command orchestrates UI + IO + HTTP. |
| `prompts/*` | `api/` | The wizard fetches catalogs to populate choices. |
| `writer/*` | nothing CLI-specific | Pure file-system layer; reusable. |
| `api/*` | `config/` | Reads the saved API URL / key per call. |
| `config/*` | `conf` | Single persisted store. |
| `utils/*` | `chalk` | UI primitives only. |

`prompts/` never talks to the file system; `writer/` never talks to the network; `api/` never prompts. That's deliberate — each module has one job.

## API client design

`buildClient()` returns a fresh axios instance per request so each call picks up the latest config. Interceptors normalize:

- `401` → `"Invalid or revoked API key. Run \`maamria-awb login\` to reconnect."`
- `>=500` → `"Maamria AI server error. Please try again in a moment."`
- otherwise the backend's `detail` field if present.

All exported helpers (`validateApiKey`, `searchTechCatalog`, `generateWorkspace`, …) throw a typed `ApiError` or `ApiKeyMissingError` so commands can branch cleanly.

## URL resolution

`getApiUrl()` resolves in this order:

1. `MAAMRIA_API_URL` env var
2. saved config (`~/Library/Preferences/maamria-ai/config.json` on macOS)
3. compiled-in default (`https://maamria.com/api-cli`)

The base URL is treated as the **single source of truth**. The client never injects `/v1` itself — the prod proxy at `/api-cli` includes the version mapping, and dev users include `/v1` directly in the URL they configure.

## Why TypeScript + tsx

The package is published with `dist/` (transpiled JS), but in development we want zero build friction. `tsx` lets the bin shim import `src/index.ts` directly via an ESM register hook, so contributors can hack on `src/` without a watch process. See `bin/maamria-awb.js` for the resolution.

## Why `prompts` over `inquirer`

`prompts` is ~1/10 the install size and supports our entire wizard surface (text, password, select, multiselect, confirm). The search-first multi-select in `prompts/searchSelect.ts` is built on top of it.

## Where things are NOT coupled to the rest of the monorepo

- The CLI lives in its own folder (`maamria-awb/`) at the repo root.
- It has its own `package.json` and `node_modules/`.
- It doesn't import from `front/` or `back/`.
- The only contract with the backend is HTTP, documented in [`api-contract.md`](./api-contract.md).
