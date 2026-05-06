# Configuration

The CLI persists two values: **`apiUrl`** and **`apiKey`**. Everything else is computed at runtime.

## File location

Backed by [`conf`](https://github.com/sindresorhus/conf), which uses the platform's recommended config dir:

| OS | Path |
|---|---|
| macOS   | `~/Library/Preferences/maamria-ai/config.json` |
| Linux   | `~/.config/maamria-ai/config.json` (or `$XDG_CONFIG_HOME/maamria-ai/config.json`) |
| Windows | `%APPDATA%\maamria-ai\Config\config.json` |

You can always print the exact path:
```
./bin/dev.sh config
./bin/dev.sh status
```

## File contents

```jsonc
{
  "apiUrl": "https://maamria.com/api-cli",
  "apiKey": "maamria_sk_…"   // omitted when not logged in
}
```

The file is created the first time you run any command. It's chmod-ed to user-only by `conf` on macOS / Linux.

## Environment variables

| Name | Effect |
|---|---|
| `MAAMRIA_API_URL` | Overrides `apiUrl` for the current process. Useful for CI and for switching dev / prod without changing saved config. |
| `MAAMRIA_API_KEY` | Overrides `apiKey` for the current process. Useful for CI. |

## Priority order

For the **API URL**:
1. `MAAMRIA_API_URL` env var
2. saved `apiUrl`
3. compiled-in default (`https://maamria.com/api-cli`)

For the **API key**:
1. `--api-key <key>` flag
2. `MAAMRIA_API_KEY` env var
3. saved `apiKey`

## Modes

| Mode | URL to set | How to set it |
|---|---|---|
| **Production** (default) | `https://maamria.com/api-cli` | Already the default. To restore: `./bin/dev.sh config --set apiUrl https://maamria.com/api-cli` |
| **Local dev** | `http://127.0.0.1:8010/v1` | `./bin/dev.sh config --set apiUrl http://127.0.0.1:8010/v1` or `export MAAMRIA_API_URL=http://127.0.0.1:8010/v1` |
| **Staging** (custom) | wherever you point it | same idea |

## Why `/v1` is in the dev URL but not the prod URL

The FastAPI router is mounted at `/v1` (`back/main.py`). In prod, the reverse proxy at `https://maamria.com/api-cli/...` forwards to `/v1/...` upstream — so the CLI's compiled-in default does **not** include `/v1`. In dev there's no proxy, so the user includes `/v1` directly.

The CLI never injects a version segment of its own. The base URL is the truth. This means you can also point it at a totally different proxy / version (`/v2`, `/api/v3/cli`, …) just by setting the URL.

## Resetting

```bash
# wipe everything
rm "$(./bin/dev.sh config | grep -oE '/[^ ]+\.json' | head -1)"

# or wipe just the key
./bin/dev.sh logout
```
