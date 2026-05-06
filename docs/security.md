# Security model

## What the API key looks like

```
maamria_sk_<6-char prefix><urlsafe-base64 body>
```

- Prefix `maamria_sk_` — fixed; lets the server cheaply discard non-keys.
- Next 6 chars — duplicated (unhashed) on the user document as `key_prefix`, used to narrow the candidate set during auth.
- Body — 32 bytes of `secrets.token_urlsafe`, ~256 bits of entropy.

## What the server stores

In `users.api_keys[]`:

| Field | Stored? | Notes |
|---|---|---|
| `key_hash` | ✅ | sha256 of the raw key, hex. **The only way to verify a key.** |
| `key_prefix` | ✅ | First 6 body chars. Lookup hint, not a secret. |
| `masked_key` | ✅ | What the UI shows. e.g. `maamria_sk_aB3kQp******T230`. |
| `id`, `name`, `is_active`, `created_at`, `last_used_at`, `revoked_at`, `scopes` | ✅ | metadata |
| **the raw key** | ❌ | shown to the client **once** in the create response and never again |

## What the CLI stores

In the `conf` config file (user-level, not in the project):

```jsonc
{
  "apiUrl": "https://maamria.com/api-cli",
  "apiKey": "maamria_sk_…"
}
```

Storing the raw key on the user's own machine is intentional — without it, every `init` would re-prompt. The file is user-only by default.

## What the CLI never does

- Never prints the full key after login (commands like `status` print the masked form only).
- Never includes the raw key in logs or error messages.
- Never writes the key into any generated workspace file.
- Never sends the key in a request body — it's always in the `Authorization: Bearer …` header.
- Never uploads anything from the user's project — it only writes downloads.

## Path safety

The backend rejects any generated path that:
- is absolute (`/foo`, `\foo`)
- contains a `..` segment
- contains a NUL byte
- has a Windows drive letter

The CLI re-validates each path against the project root using `path.resolve()` and refuses anything that escapes. Both layers must pass before a file is written.

## Conflict handling

When the CLI is about to overwrite an existing file, it prompts:
- **Overwrite** — replace
- **Skip** — leave existing in place
- **Backup** — copy to `.maamria-backups/<timestamp>/<rel-path>`, then write
- **Cancel** — stop the entire write

There are also "all remaining" shortcuts so you don't get prompted dozens of times.

## Revocation

The web dashboard's **Revoke** action sets `is_active=false` and `revoked_at=now`. The next request from that key fails with `401`. The CLI's interceptor maps this to:

```
✗ Invalid or revoked API key. Run `maamria-awb login` to reconnect.
```

Hard-deleting a key (the **Delete** action) `$pull`s it from `users.api_keys[]`. Same effect from the CLI's perspective.

## Threats considered, decisions made

| Threat | Mitigation |
|---|---|
| Stolen DB dump | Hashes only — raw keys cannot be recovered. |
| Stolen laptop with saved CLI key | The user revokes the key from the dashboard. We consider device-level protection (FileVault, etc.) the user's responsibility. |
| Logs leaking the key | Headers aren't logged by the CLI; backend never logs `Authorization`. The masked form is safe to print. |
| Compromised npm package | Out of scope for this CLI — review the published `dist/` if concerned. |
| Server-side path traversal | Validated server-side **and** client-side. |
| Replay of an old key after rename | Renaming keeps the same `id` and hash, so it doesn't break sessions. Revoking does. |

## Recommendations to operators

- Rate-limit `POST /v1/api-keys` if the platform offers it.
- Consider adding `scopes` (the field already exists on the model, defaulting to `[]`) when the CLI grows past `init`.
- Watch `last_used_at` on the user document if you want to age out keys automatically.
