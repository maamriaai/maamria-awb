#!/usr/bin/env node
// Resolve in this order:
//   1) compiled dist/index.js  (production / published package)
//   2) src/index.ts via tsx     (dev mode — no build step required)
import { existsSync } from 'node:fs'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { dirname, resolve } from 'node:path'

const here = dirname(fileURLToPath(import.meta.url))
const distEntry = resolve(here, '..', 'dist', 'index.js')
const srcEntry = resolve(here, '..', 'src', 'index.ts')

if (existsSync(distEntry)) {
  await import(pathToFileURL(distEntry).href)
} else if (existsSync(srcEntry)) {
  // No dist/ — try to load tsx as an ESM register hook so we can run
  // src/index.ts directly. This keeps `npm link` working in dev without
  // requiring the developer to `npm run build` first.
  try {
    const { register } = await import('tsx/esm/api')
    register()
    await import(pathToFileURL(srcEntry).href)
  } catch (err) {
    console.error(
      '[maamria-awb] dist/ not built and tsx is not installed.\n' +
        '  Run one of:\n' +
        '    • npm install && npm run build      (build once, then re-run)\n' +
        '    • npm install && npm run cli -- ... (dev mode, no build)\n' +
        '    • npx tsx src/index.ts ...          (one-off invocation)',
    )
    if (err && err.message) console.error(`  Underlying error: ${err.message}`)
    process.exit(1)
  }
} else {
  console.error('[maamria-awb] could not locate the CLI entry point (no dist/, no src/).')
  process.exit(1)
}
