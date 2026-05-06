import { Command } from 'commander'
import { configCommand } from './commands/config.js'
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
  .alias('generate')
  .description('Run the interactive wizard and write workspace files into the current directory.')
  .option('-y, --yes', 'Skip the final confirmation prompt')
  .action(async (opts) => {
    await initCommand({ yes: !!opts.yes })
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
