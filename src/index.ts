import { Command } from 'commander'
import { configCommand } from './commands/config.js'
import { generateCommand } from './commands/generate.js'
import { initCommand } from './commands/init.js'
import { loginCommand } from './commands/login.js'
import { logoutCommand } from './commands/logout.js'
import { statusCommand } from './commands/status.js'
import { CLI_VERSION } from './utils/version.js'

const program = new Command()

program
  .name('maamria-awb')
  .description('Maamria AI Workspace Builder — generate AI workspace files from your terminal.')
  .version(CLI_VERSION)
  .option('--api-key <key>', 'Use a specific API key for this command (overrides config and env)')

program
  .command('login')
  .description('Connect this machine to your Maamria AI account using an API key.')
  .option('-f, --force', 'Replace any existing saved key without confirmation')
  .option('--api-key <key>', 'Use the given key non-interactively')
  .action(async (opts) => {
    const flag = (opts.apiKey as string) || (program.opts().apiKey as string) || undefined
    if (flag) process.env.MAAMRIA_API_KEY = flag
    await loginCommand({ force: !!opts.force, apiKey: flag })
  })

program
  .command('logout')
  .description('Remove the saved API key from this machine.')
  .action(async () => {
    await logoutCommand()
  })

program
  .command('status')
  .description('Show whether the CLI is connected and to whom.')
  .action(async () => {
    await statusCommand()
  })

program
  .command('init')
  .description('Run the interactive wizard and write workspace files into the current directory.')
  .option('-y, --yes', 'Skip the final confirmation prompt')
  .action(async (opts) => {
    await initCommand({ yes: !!opts.yes })
  })

// `generate` is a real command, but stays backward-compatible: when called
// with no new flags it delegates to the interactive `init` flow, preserving
// the behavior of the historical `init`-as-`generate` alias.
program
  .command('generate')
  .description(
    'Generate a workspace non-interactively from flags. With no new flags, opens the interactive wizard.',
  )
  .option('-y, --yes', 'Skip prompts; in interactive fallback acts like `init -y`')
  .option('--assistant <assistant>', 'Target AI assistant, e.g. claude-code')
  .option('--project-type <type>', 'Project type, e.g. saas')
  .option('--stack <csv>', 'Comma-separated tech stack slugs, e.g. fastapi,vue-nuxt')
  .option('--mode <mode>', 'Behavior mode: safe | startup | enterprise')
  .option('--rules <csv>', 'Comma-separated extra rule keys to enable')
  .option('--project-name <name>', 'Project name (required in --no-interactive)')
  .option('--description <text>', 'Short project description')
  .option('--output <path>', 'Output directory (default: current directory)')
  .option('--language <lang>', 'Language for generated instructions, e.g. en')
  .option('--include-suggestions', 'Also include Suggested items from /cli/recommend')
  .option(
    '--interactive-recommendations',
    'Prompt to toggle Suggested items (TTY only; clashes with --yes / --no-interactive)',
  )
  .option('--dry-run', 'Print recommendation summary + resolved payload, write nothing')
  .option('--preview', 'Call /cli/generate but only print the file list (no writes; still persists to history)')
  .option('--force', 'Overwrite existing files during writing')
  .option('--no-interactive', 'Fail rather than prompt for missing required values')
  .option('--api-key <key>', 'Use a specific API key for this command (overrides config and env)')
  .action(async (opts) => {
    const flag = (opts.apiKey as string) || (program.opts().apiKey as string) || undefined
    if (flag) process.env.MAAMRIA_API_KEY = flag
    await generateCommand(opts)
  })

program
  .command('config')
  .description('Inspect or update CLI configuration.')
  .option('--set <kv...>', 'Set a config value, e.g. --set apiUrl https://api.maamria.com')
  .action(async (opts) => {
    await configCommand({ set: opts.set })
  })

program.parseAsync(process.argv).catch((err) => {
  console.error(err?.message || err)
  process.exit(1)
})
