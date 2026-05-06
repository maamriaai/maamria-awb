import chalk from 'chalk'
import { ApiError, ApiKeyMissingError, validateApiKey } from '../api/client.js'
import { configPath, getApiKey, getApiUrl, hasSavedKey } from '../config/store.js'
import { banner, error, info, maskKey, success, warn } from '../utils/logger.js'

export const statusCommand = async (): Promise<void> => {
  banner()
  info(`API URL: ${chalk.cyan(getApiUrl())}`)
  info(`Config:  ${chalk.dim(configPath())}`)

  const key = getApiKey()
  if (!key) {
    warn('Not logged in. Run `maamria-awb login`.')
    return
  }
  info(`API key: ${chalk.cyan(maskKey(key))}${hasSavedKey() ? '' : chalk.dim(' (from env)')}`)

  try {
    const result = await validateApiKey()
    success(
      `Connected as ${chalk.cyan(result.user.email || result.user.username || result.user.id)}.`,
    )
  } catch (err) {
    if (err instanceof ApiKeyMissingError) warn(err.message)
    else if (err instanceof ApiError) error(err.message)
    else if (err instanceof Error) error(err.message)
    process.exit(1)
  }
}
