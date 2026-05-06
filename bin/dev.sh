#!/usr/bin/env bash
# Run the CLI directly from src/ without a build step.
#
#   ./bin/dev.sh login
#   ./bin/dev.sh status
#   ./bin/dev.sh init
#
# Set MAAMRIA_API_URL=http://127.0.0.1:8010/v1 in your shell (or in
# .env.local — see docs/dev-setup.md) so it talks to the local backend.
set -euo pipefail

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$DIR"

if [ ! -d node_modules ]; then
  echo "[dev.sh] node_modules/ missing — running install once."
  if command -v pnpm >/dev/null 2>&1; then
    pnpm install
  elif command -v npm >/dev/null 2>&1; then
    npm install
  else
    echo "Neither pnpm nor npm found in PATH." >&2
    exit 1
  fi
fi

exec npx tsx src/index.ts "$@"
