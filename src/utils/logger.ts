import chalk from 'chalk'
import { CLI_VERSION } from './version.js'

// Block-letter logo. Six lines tall, fixed-width — renders cleanly in any
// terminal that supports box-drawing characters (every modern emulator).
const LOGO_LINES = [
  '███╗   ███╗  █████╗   █████╗  ███╗   ███╗ ██████╗  ██╗  █████╗ ',
  '████╗ ████║ ██╔══██╗ ██╔══██╗ ████╗ ████║ ██╔══██╗ ██║ ██╔══██╗',
  '██╔████╔██║ ███████║ ███████║ ██╔████╔██║ ██████╔╝ ██║ ███████║',
  '██║╚██╔╝██║ ██╔══██║ ██╔══██║ ██║╚██╔╝██║ ██╔══██╗ ██║ ██╔══██║',
  '██║ ╚═╝ ██║ ██║  ██║ ██║  ██║ ██║ ╚═╝ ██║ ██║  ██║ ██║ ██║  ██║',
  '╚═╝     ╚═╝ ╚═╝  ╚═╝ ╚═╝  ╚═╝ ╚═╝     ╚═╝ ╚═╝  ╚═╝ ╚═╝ ╚═╝  ╚═╝',
]

const TAGLINE = 'AI Workspace Builder'
const SUBTITLE = 'Generate Claude Code, Cursor, Copilot & ChatGPT workspaces'
const URL_LINE = 'https://maamria.com  ·  /profile/api-keys'

const PAD = '  '

export const banner = (): void => {
  // Compact form when stdout isn't a TTY (CI, piped output) — keeps
  // logs grep-friendly.
  if (!process.stdout.isTTY) {
    console.log(`Maamria AI · AI Workspace Builder · v${CLI_VERSION}`)
    return
  }

  console.log()
  for (const line of LOGO_LINES) {
    console.log(PAD + chalk.cyan(line))
  }
  console.log()
  console.log(
    PAD +
      chalk.bold.white(TAGLINE) +
      chalk.dim('  ·  ') +
      chalk.cyan(`v${CLI_VERSION}`),
  )
  console.log(PAD + chalk.gray(SUBTITLE))
  console.log(PAD + chalk.dim(URL_LINE))
  console.log()
}

export const info = (msg: string): void => console.log(chalk.cyan('ℹ'), msg)
export const success = (msg: string): void => console.log(chalk.green('✓'), msg)
export const warn = (msg: string): void => console.log(chalk.yellow('!'), msg)
export const error = (msg: string): void => console.log(chalk.red('✗'), msg)
export const dim = (msg: string): string => chalk.dim(msg)
export const highlight = (msg: string): string => chalk.cyan(msg)

export const maskKey = (key: string | undefined): string => {
  if (!key) return '(none)'
  if (key.length <= 16) return '••••'
  return `${key.slice(0, 14)}••••${key.slice(-4)}`
}
