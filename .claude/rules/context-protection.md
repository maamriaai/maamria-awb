# Context Protection & Token Saving

This rule defines folders and file patterns that **must not** be read,
indexed, grepped, globbed, summarized, or otherwise analyzed by Claude
Code in this project.

It exists for three reasons:

1. **Token economy.** Reading `node_modules/` or compiled artefacts burns
   thousands of tokens that produce no useful signal.
2. **Focus.** Build outputs and caches drown out the source files that
   actually matter for a task.
3. **Safety.** Some paths (`.env`, `.git/`, dump files) hold secrets or
   irrelevant history that shouldn't enter Claude's context.

## Behaviour Mode

This workspace was generated in **startup** mode. The pattern set below
reflects that mode's defaults plus any custom patterns the user added at
generation time.

## Patterns to Ignore

- `.git/`
- `.vscode/`
- `.idea/`
- `.history/`
- `.DS_Store`
- `Thumbs.db`
- `.env`
- `.env.*`
- `*.log`
- `logs/`
- `tmp/`
- `temp/`
- `.cache/`
- `coverage/`

## How This Is Enforced

- `.claude/settings.json` declares Read / Glob / Grep denies for these
  paths. Claude Code blocks tool calls that match.
- `CLAUDE.md` repeats the list in plain prose so the model sees the
  intent in every conversation.
- This file (`.claude/rules/context-protection.md`) is the canonical
  reference. Update it here first, then mirror to the other files.

## When To Override

If a task genuinely requires touching one of these paths (debugging a
specific dependency in `node_modules/`, reading a single log file, etc.),
the user must say so explicitly. Even then, prefer asking for the file
content to be pasted into chat rather than reading the file directly.
