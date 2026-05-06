// Single source of truth for the CLI version. Bumped here, surfaced
// in the banner and via `--version`.
//
// Read from package.json at runtime so the published package always
// shows the version it was built with — no risk of drift.
import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const FALLBACK = '0.0.0'

const readPkgVersion = (): string => {
  try {
    const here = dirname(fileURLToPath(import.meta.url))
    // src/utils/version.ts → package.json is two levels up
    // dist/utils/version.js → package.json is two levels up
    const pkgPath = resolve(here, '..', '..', 'package.json')
    const raw = readFileSync(pkgPath, 'utf8')
    return JSON.parse(raw).version || FALLBACK
  } catch {
    return FALLBACK
  }
}

export const CLI_VERSION = readPkgVersion()
