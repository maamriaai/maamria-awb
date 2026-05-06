# Security policy

Security matters more than velocity here. This document explains how we handle credentials, what to expect from the CLI, and how to report a vulnerability privately.

## Reporting a vulnerability

**Please do not open public GitHub issues for security problems.** Instead, email:

> **security@maamria.com**

Include:

- A description of the issue.
- Steps to reproduce (if available).
- Affected versions of `@maamria/awb`.
- Any proof-of-concept code or logs (with secrets redacted).
- Whether you'd like credit in the release notes.

We aim to acknowledge reports within **3 business days** and provide a remediation timeline within **7 business days**. Critical issues will be patched as a point release; you'll receive a notification before public disclosure.

We will not pursue legal action against good-faith security research conducted under this policy.

## Supported versions

| Version | Supported |
|---|---|
| `0.x` (current) | ✅ |
| earlier | n/a — pre-public release |

When `1.0` ships, we'll update this table to reflect the previous minor's support window.

## How API keys are handled

### On the server

- Keys are generated with **256 bits of entropy** (`secrets.token_urlsafe(32)`) and prefixed with `maamria_sk_`.
- Only a **SHA-256 hash** of the key is persisted on the user document. The plaintext is shown to the client exactly **once** (in the create response) and never stored.
- A short, unhashed `key_prefix` is also stored — used solely as a lookup hint to narrow the candidate set during auth. It's not a secret.
- Revoking a key (`is_active=false`, `revoked_at=now`) makes the next request from that key fail with `401`. Hard delete (`$pull` from `users.api_keys[]`) has the same effect.

### On the wire

- API keys are sent in the **`Authorization: Bearer <key>`** header. They never appear in URLs and never in request bodies.
- HTTPS is required for any production deployment. The hosted public endpoint is **not live yet**; until then, point the CLI at your own FastAPI deployment via `MAAMRIA_API_URL` (always over HTTPS, with the `/v1` suffix).

### On your machine

- After successful `maamria-awb login`, the raw key is saved in your OS user-config directory:
  - macOS: `~/Library/Preferences/maamria-ai/config.json`
  - Linux: `~/.config/maamria-ai/config.json`
  - Windows: `%APPDATA%\maamria-ai\Config\config.json`
- The file is created with user-only permissions by `conf`. **It is not stored in your project directory.**
- Run `maamria-awb logout` to wipe the saved key. Run `maamria-awb login --force` to replace it.

### What the CLI never does

- Never prints the full key after login. `maamria-awb status` shows only the masked form (`maamria_sk_aB3kQp••••T230`).
- Never logs raw keys, even on error.
- Never includes the key in any generated workspace file.
- Never sends the key to an unauthenticated endpoint.
- Never opens a network connection that isn't to the configured `apiUrl`.

### Threats considered

| Threat | Mitigation |
|---|---|
| Stolen DB dump | Hashes only — raw keys cannot be recovered. |
| Stolen laptop with saved CLI key | User revokes the key from the dashboard; FileVault / disk encryption is the user's responsibility. |
| Logs leaking the key | The CLI never prints the raw key; the backend never logs the `Authorization` header. |
| Path traversal in generated files | Backend validates every path; CLI re-validates against the project root before writing. |
| Compromised npm package | Releases are signed with `npm publish --provenance` (Node 18+) once we move to CI publishing. Verify the published tarball before installing if in doubt. |
| Shared CI keys | Use **automation tokens** (npm) or **fine-grained PATs** (GitHub) scoped to the minimum required. |

Detailed model: [`docs/security.md`](./docs/security.md).

## Path-safety guarantees during generation

When `init` writes files, the CLI rejects any path that:

- is absolute (`/foo`, `\foo`),
- contains a `..` segment,
- contains a NUL byte,
- has a Windows drive letter,
- resolves outside the current project root.

Both the **server** (in `CliWorkspaceController._is_safe_relative_path`) and the **client** (in `src/writer/safePaths.ts`) enforce these rules. A bad template file cannot escape the working directory.

## Disclosure policy

For confirmed vulnerabilities:

1. We patch and release a fix.
2. We notify users with active API keys via the dashboard (when applicable).
3. After ~30 days (sooner for trivial issues, longer when coordination is needed), we publish a brief advisory crediting the reporter unless they prefer anonymity.
