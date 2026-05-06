---
name: Bug report
about: Something isn't working as expected.
title: "[bug] "
labels: ["bug"]
assignees: []
---

> ⚠️ **Never paste raw API keys, tokens, or secrets.** If logs include them, redact every occurrence to `maamria_sk_••••` (or similar) before hitting submit.

## Environment

- **`@maamria/awb` version:** (output of `maamria-awb --version`)
- **Node.js version:** (output of `node -v`)
- **OS / shell:** (e.g. macOS 14.5 / zsh, Ubuntu 22.04 / bash, Windows 11 / PowerShell)
- **Backend URL** (output of `maamria-awb config`, e.g. `http://127.0.0.1:8010/v1`, `https://your-deploy.example.com/v1`) — please redact any private hostnames if needed

## Command used

```bash
# the exact command you ran (with secrets redacted)
maamria-awb …
```

## Expected behaviour

A short, concrete description of what should have happened.

## Actual behaviour

What happened instead. Include error messages.

## Logs / output

```
Paste relevant CLI output here. Redact API keys.
```

If the bug involves a request to the backend, include the URL and HTTP status (without the `Authorization` header value). For example:

```
GET /ai-workspace-builder/cli/technology-catalog?category=monitoring&limit=200 → 200 OK
```

## Steps to reproduce

1. …
2. …
3. …

## Anything else?

Was this working in a previous version? Any unusual config, proxies, corporate network constraints? Anything you've already tried?
