# Backend ↔ CLI HTTP contract

The CLI talks **only** over HTTP and **only** to these endpoints. The base URL is configured (default: `https://maamria.com/api-cli`); paths below are relative to it.

## Auth

Every request sends:

```
Authorization: Bearer <maamria_sk_…>
```

(The CLI also accepts `X-API-Key` server-side, but the CLI itself always uses `Authorization`.)

The backend resolves the key by sha256-hashing it and matching against any active record in `users.api_keys[]`. On match, `last_used_at` is updated server-side.

## Endpoints

| Method | Path | Auth | Used by |
|---|---|---|---|
| `GET`  | `/api-keys/validate` | API key | `login`, `status` |
| `GET`  | `/ai-workspace-builder/cli/me` | API key | (reserved) |
| `GET`  | `/ai-workspace-builder/cli/options` | API key | `init` (assistant + project-type fallback) |
| `GET`  | `/ai-workspace-builder/cli/technology-categories` | API key | `init` (one ask per category) |
| `GET`  | `/ai-workspace-builder/cli/technology-catalog` | API key | `init` (search-first multi-select) |
| `GET`  | `/ai-workspace-builder/cli/claude-feature-catalog` | API key | `init` (agents / skills / commands search) |
| `POST` | `/ai-workspace-builder/cli/generate` | API key | `init` (writes the result to disk) |

Search endpoints accept `?search=<q>&limit=20&offset=0`. Paged results return `{ items, total, limit, offset, has_more }`.

## `POST /ai-workspace-builder/cli/generate`

### Request

The CLI sends the camelCase shape that `WorkspaceInputSchema` accepts (the schema also tolerates snake_case via `validation_alias`):

```jsonc
{
  "assistants":          ["claude-code"],
  "projectType":         "saas",
  "techStack":           ["python-fastapi", "vue-nuxt", "mongodb", "docker"],
  "behaviorMode":        "safe",
  "rules": {
    "ask_before_delete":         true,
    "preserve_backward_compat":  true,
    "never_expose_secrets":      true,
    "update_docs_after_change":  false,
    "follow_clean_architecture": false,
    "write_unit_tests":          false,
    "explain_decisions":         false
  },
  "agents":              ["backend-architect"],
  "skills":              ["fastapi", "vue"],
  "commands":            [],
  "projectName":         "my-saas",
  "projectDescription":  "A SaaS platform for…",
  "language":            "en"
}
```

### Response

```jsonc
{
  "success": true,
  "data": {
    "id":           "67…",            // generation id (saved server-side too)
    "project_name": "my-saas",
    "assistants":   ["claude-code"],
    "project_type": "saas",
    "files_count":  12,
    "files": [
      { "path": "CLAUDE.md", "content": "…" },
      { "path": ".claude/settings.json", "content": "{…}" },
      { "path": ".claude/agents/backend-architect.md", "content": "…" }
    ],
    "warnings":     [],               // server-rejected paths, if any
    "generated_at": "2026-05-06T12:00:00Z"
  }
}
```

The server validates every `path` to be relative-only (no `..`, no leading `/`, no drive letters). The CLI re-validates client-side as defence in depth.

## Error shapes

```jsonc
// 401
{ "detail": "Invalid or revoked API key" }

// 4xx with structured detail (e.g. /auth/token email-not-confirmed)
{ "detail": { "code": "EMAIL_NOT_CONFIRMED", "message": "…" } }

// 5xx
{ "detail": "Internal Server Error" }
```

The CLI normalises these in `src/api/client.ts` into `ApiError(status, message, detail?)`.

## Schemas — backend side

| Concern | File |
|---|---|
| Input model | `back/models/AiWorkspaceBuilder/WorkspaceGeneration.py` (`WorkspaceInputSchema`) |
| API key model | `back/models/user.py` (`ApiKey` embedded under `User.api_keys`) |
| API key service | `back/services/ApiKeyService.py` |
| API key auth dependency | `back/Utils/api_key_auth.py` (`verify_api_key`) |
| API key CRUD routes | `back/router/ApiKeyController.py` |
| CLI generate routes | `back/router/AiWorkspaceBuilder/CliWorkspaceController.py` |

If you change a Pydantic field on the backend (e.g. add a new option), update `src/api/types.ts` to match.
