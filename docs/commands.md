# Commands

Every command supports `--help`:

```
./bin/dev.sh login --help
./bin/dev.sh init --help
```

Below is the canonical reference.

---

## `maamria-awb login`

Connect this machine to your Maamria AI account.

```
./bin/dev.sh login
./bin/dev.sh login --force                  # replace an existing saved key
./bin/dev.sh login --api-key maamria_sk_...  # non-interactive (CI)
```

**Flow:**

1. Prints the banner and current API URL.
2. If a key is already saved, asks whether to replace (skipped with `--force`).
3. Prompts for the key (input is hidden).
4. Validates by calling `GET /api-keys/validate`.
5. On success, saves the key into `conf` storage; prints the email of the owner.
6. On failure, **does not** save anything.

The raw key is **never** echoed back after login.

---

## `maamria-awb logout`

Removes the saved API key from this machine. Other config (e.g. `apiUrl`) is preserved.

```
./bin/dev.sh logout
```

---

## `maamria-awb status`

Shows whether the CLI is connected and to whom. Never prints the full key — only a masked form like `maamria_sk_aB3kQp••••T230`.

```
./bin/dev.sh status
```

Output (logged-in):
```
ℹ API URL: http://127.0.0.1:8010/v1
ℹ Config:  /Users/me/Library/Preferences/maamria-ai/config.json
ℹ API key: maamria_sk_aB3kQp••••T230
✓ Connected as me@example.com.
```

Output (not logged-in):
```
! Not logged in. Run `maamria-awb login`.
```

---

## `maamria-awb init`  (alias: `generate`)

The interactive wizard. Walks you through the same options the web wizard has, then generates and writes the workspace into the current directory.

```
./bin/dev.sh init
./bin/dev.sh init --yes        # skip the final "Generate now?" confirmation
```

**Flow:**

1. **Assistant** — single select (Claude Code, Cursor, etc.).
2. **Project type** — single select (SaaS, e-commerce, …).
3. **Tech stack** — for each backend category, a search-first multi-select. You can skip categories you don't need.
4. **Mode** — Safe / Startup / Enterprise.
5. **Rules** — multi-select; common defaults are pre-selected.
6. **Agents** — optional, search-first multi-select.
7. **Skills** — optional, search-first multi-select.
8. **Commands** — optional, search-first multi-select.
9. **Project details** — name, description, language, output directory.
10. **Confirmation** — recap, then generate.
11. **Write** — for each conflict, you'll be asked: overwrite / skip / backup, with "all-remaining" shortcuts.

Backups land under `.maamria-backups/<UTC-timestamp>/<original path>`.

### File writing safety

The CLI rejects, on the client side, any path that:

- is absolute (`/foo`, `\foo`, `C:\foo`)
- contains a `..` segment
- contains a NUL byte

It also re-resolves every path against the project root and refuses anything that escapes it.

---

## `maamria-awb config`

Inspect or update CLI configuration.

```
./bin/dev.sh config
./bin/dev.sh config --set apiUrl http://127.0.0.1:8010/v1
./bin/dev.sh config --set apiUrl https://maamria.com/api-cli
```

`MAAMRIA_API_URL` (env) overrides the saved value.

---

## Global flags

- `--api-key <key>` — use the given key for this single invocation, ignoring saved/env. Useful for testing a fresh key without overwriting login.
- `--help` / `-h`
- `--version` / `-V`

---

## Exit codes

| Code | Meaning |
|---|---|
| 0 | Success |
| 1 | Any failure (auth, network, generation, write) — error is printed to stderr |
