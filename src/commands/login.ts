import prompts from 'prompts'
import ora from 'ora'
import chalk from 'chalk'
import { ApiError, validateApiKey } from '../api/client.js'
import { hasSavedKey, saveApiKey, getApiUrl } from '../config/store.js'
import { banner, error, info, success } from '../utils/logger.js'

interface LoginOptions {
  force?: boolean
  apiKey?: string
}

export const loginCommand = async (opts: LoginOptions = {}): Promise<void> => {
  banner()
  info(`API URL: ${chalk.cyan(getApiUrl())}`)

  if (hasSavedKey() && !opts.force) {
    const { replace } = await prompts({
      type: 'confirm',
      name: 'replace',
      message: 'You are already logged in. Replace the saved API key?',
      initial: false,
    })
    if (!replace) {
      info('Login cancelled. Keeping the existing key.')
      return
    }
  }

  let rawKey = opts.apiKey?.trim()
  if (!rawKey) {
    const { key } = await prompts({
      type: 'password',
      name: 'key',
      message: 'Paste your Maamria AI API key:',
    })
    rawKey = (key || '').trim()
  }

  if (!rawKey) {
    error('No API key provided.')
    process.exit(1)
  }

  if (!rawKey.startsWith('maamria_sk_')) {
    error('That does not look like a Maamria AI API key (it should start with "maamria_sk_").')
    process.exit(1)
  }

  const spinner = ora('Validating API key…').start()
  try {
    const result = await validateApiKey(rawKey)
    spinner.succeed('API key is valid.')
    saveApiKey(rawKey)
    success(
      `Logged in as ${chalk.cyan(result.user.email || result.user.username || result.user.id)}.`,
    )
    info('You can now run `maamria-awb init` in any project.')
  } catch (err) {
    spinner.fail('Could not validate API key.')
    if (err instanceof ApiError) error(err.message)
    else if (err instanceof Error) error(err.message)
    process.exit(1)
  }
}
