# Running the CLI locally (dev mode)

This guide gets you running `maamria-awb` from the source tree **without publishing to npm**, **without `npm install -g`**, and **without `npm link`** if you prefer.

## 1. Prerequisites

- **Node.js ≥ 18** (`node -v`)
- Either **npm** (ships with Node) or **pnpm** — both work.
- The Maamria AI backend running locally on **`127.0.0.1:8010`**:
  ```bash
  cd back
  ./maamria_ai_venv/bin/uvicorn main:app --reload --port 8010
  ```
- An API key — create one from the web app at `http://localhost:3002/profile/api-keys` and copy the raw key once.

## 2. Install the CLI's local dependencies (once)

```bash
cd maamria-awb
npm install              # or: pnpm install
```

> If `npm install` fails on your machine for any reason, try:
> ```bash
> npm install --no-audit --no-fund --no-optional
> ```

This populates `node_modules/` inside `maamria-awb/`. Nothing global is installed.

## 3. Point the CLI at the local backend

The default API URL is the production proxy (`https://maamria.com/api-cli`). For dev, override it. Pick **one** of the three ways:

```bash
# (a) export it in your shell session
export MAAMRIA_API_URL=http://127.0.0.1:8010/v1

# (b) persist it to the CLI config file
./bin/dev.sh config --set apiUrl http://127.0.0.1:8010/v1

# (c) prepend it inline per-command
MAAMRIA_API_URL=http://127.0.0.1:8010/v1 ./bin/dev.sh status
```

Verify it stuck:

```bash
./bin/dev.sh config
# → API URL: http://127.0.0.1:8010/v1
```

## 4. Run the CLI from source

You have **three** equivalent ways. Pick whichever you like:

### Option A — `./bin/dev.sh` wrapper (recommended)

```bash
./bin/dev.sh login
./bin/dev.sh status
./bin/dev.sh init
```

The wrapper auto-installs `node_modules/` if missing and runs `tsx src/index.ts <args>` under the hood. It works regardless of whether you've built `dist/` or not.

### Option B — `npm run cli`

```bash
npm run cli -- login
npm run cli -- status
npm run cli -- init
```

The trailing `--` is required to pass arguments through `npm run` to the CLI.

### Option C — `npx tsx` directly

```bash
npx tsx src/index.ts login
npx tsx src/index.ts status
npx tsx src/index.ts init
```

### Option D — `node bin/maamria-awb.js`

```bash
node bin/maamria-awb.js login
```

The `bin/` script tries `dist/index.js` first, then falls back to `tsx` on `src/index.ts`. So this works in dev with no build, **and** in prod after `npm run build`.

## 5. Full end-to-end smoke test

```bash
# Terminal 1 — backend
cd back && ./maamria_ai_venv/bin/uvicorn main:app --reload --port 8010

# Terminal 2 — frontend (to create the API key from /profile/api-keys)
cd front && npm run dev   # http://localhost:3002

# Terminal 3 — the CLI
cd maamria-awb
npm install

export MAAMRIA_API_URL=http://127.0.0.1:8010/v1
./bin/dev.sh status               # "Not logged in"
./bin/dev.sh login                # paste the key created in step 5b
./bin/dev.sh status               # shows your email

mkdir -p /tmp/awb-test && cd /tmp/awb-test
~/maamria-awb/bin/dev.sh init
ls -la                            # CLAUDE.md, .claude/, etc.
```

## 6. Switching between dev and prod

```bash
# back to prod
./bin/dev.sh config --set apiUrl https://maamria.com/api-cli

# back to dev
./bin/dev.sh config --set apiUrl http://127.0.0.1:8010/v1
```

Or use the env var (which takes precedence):
```bash
unset MAAMRIA_API_URL    # falls back to the saved config value
```

## 7. Want to test the production-style binary?

```bash
npm run build       # writes dist/index.js
node bin/maamria-awb.js status
# now bin/ is using dist/, not tsx
```

Watch mode (rebuild on save) for iterative dev:
```bash
npm run watch
# in another shell
node bin/maamria-awb.js status
```

## 8. Linking globally (optional)

If you'd rather type `maamria-awb` from anywhere instead of `./bin/dev.sh`:

```bash
npm link              # inside maamria-awb/
maamria-awb status    # works in any directory now
npm unlink -g @maamria/awb   # to undo
```

`bin/maamria-awb.js` will load `tsx` automatically, so a global link still works without a build step.

## Common pitfalls

- **`Not logged in`** — your saved API key was wiped, or you're hitting the wrong base URL. Run `./bin/dev.sh config` to check, then re-run `login`.
- **`Invalid or revoked API key`** — the key was revoked from the dashboard, or you're hitting prod with a dev key (or vice versa).
- **`ECONNREFUSED 127.0.0.1:8010`** — the backend isn't running. Start it (`uvicorn main:app --reload --port 8010`).
- **`dist/ not built and tsx is not installed`** — you ran `node bin/maamria-awb.js` without a build and without `npm install` first. Run `npm install` inside `maamria-awb/`.
- **The CLI says `https://api.maamria.com`** instead of `https://maamria.com/api-cli` — your `~/Library/Preferences/maamria-ai/config.json` (macOS) has an old persisted value. Delete it or run `config --set apiUrl https://maamria.com/api-cli`.
