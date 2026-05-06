# Troubleshooting

Symptoms and fixes, ordered by how often they come up.

---

## "Not logged in. Run `maamria-awb login`."

You don't have a saved key, and `MAAMRIA_API_KEY` isn't set. Run:

```bash
./bin/dev.sh login
```

If you *did* log in and this comes back, your `conf` file may have been wiped. Check:

```bash
./bin/dev.sh config        # prints the file path
cat <that path>            # should contain "apiKey"
```

---

## "Invalid or revoked API key. Run `maamria-awb login` to reconnect."

The backend rejected the key with `401`. Either:

- you revoked the key from `https://maamria.com/profile/api-keys` — create a new one and `./bin/dev.sh login` again.
- you're hitting prod with a dev key (or vice versa). Check `./bin/dev.sh config` and switch.

---

## "Maamria AI server error. Please try again in a moment."

5xx from the server. Check the backend logs (`uvicorn` terminal in dev). The CLI doesn't retry automatically — re-run the command after the backend recovers.

---

## `ECONNREFUSED 127.0.0.1:8010`

The dev backend isn't running. Start it:

```bash
cd back
./maamria_ai_venv/bin/uvicorn main:app --reload --port 8010
```

If you're trying to hit prod, your `apiUrl` is still pointing at dev. Run:

```bash
./bin/dev.sh config --set apiUrl https://maamria.com/api-cli
```

---

## `ENOTFOUND maamria.com`

Network problem or DNS issue. Confirm with `curl -I https://maamria.com/api-cli/api-keys/validate -H "Authorization: Bearer …"`.

---

## "dist/ not built and tsx is not installed"

You ran `node bin/maamria-awb.js …` from a checkout where neither `dist/` exists nor `tsx` is installed. Fix:

```bash
cd maamria-awb
npm install         # installs tsx (devDependency)
# now you can run any of:
./bin/dev.sh status
node bin/maamria-awb.js status
npm run cli -- status
```

---

## "Cannot find module 'tsx/esm/api'"

Same root cause as above — `node_modules/` isn't populated. `npm install` inside `maamria-awb/`.

---

## The CLI shows `https://api.maamria.com` instead of `https://maamria.com/api-cli`

Your config file has an old persisted value. Wipe it:

```bash
rm "$(./bin/dev.sh config 2>/dev/null | awk -F': ' '/Config file/ {print $2}')"
```

Or set the new URL explicitly:
```bash
./bin/dev.sh config --set apiUrl https://maamria.com/api-cli
```

---

## "Generation failed: <message>"

The wizard sent a payload the backend rejected. Re-run with the env var on so you can see the full traceback in the backend's terminal:

```bash
LOGLEVEL=DEBUG ./bin/dev.sh init
```

Common causes:
- empty `projectName` (the wizard validates this; if you bypassed it somehow, fix it)
- a tech-stack id the backend doesn't recognise (search again in the wizard)

---

## File conflicts feel chatty

Use the "all remaining" shortcuts when prompted:
- **Overwrite ALL remaining conflicts**
- **Skip ALL remaining conflicts**
- **Back up ALL remaining conflicts**

You'll only get asked once.

---

## Old backups piling up

Backups land in `.maamria-backups/<UTC-timestamp>/`. Add it to your `.gitignore` if you don't want them tracked:

```
echo .maamria-backups/ >> .gitignore
```

The CLI never deletes backups itself.

---

## "Cannot read properties of undefined (reading 'items')"

A search endpoint returned an unexpected shape. Most likely your backend version is older than the CLI version. Pull the latest and restart `uvicorn`.
