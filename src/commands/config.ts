import chalk from 'chalk'
import { configPath, getApiUrl, setApiUrl } from '../config/store.js'
import { info, success } from '../utils/logger.js'

interface ConfigOptions {
  set?: string[]
}

export const configCommand = async (opts: ConfigOptions = {}): Promise<void> => {
  if (opts.set && opts.set.length === 2) {
    const [key, value] = opts.set
    if (key === 'apiUrl') {
      setApiUrl(value)
      success(`apiUrl set to ${chalk.cyan(value)}`)
      return
    }
    info(`Unknown config key: ${key}`)
    return
  }
  info(`API URL: ${chalk.cyan(getApiUrl())}`)
  info(`Config file: ${chalk.dim(configPath())}`)
  info('')
  info('To change the API URL:')
  info(chalk.dim('  maamria-awb config --set apiUrl https://api.maamria.com'))
  info('Or use the environment variable MAAMRIA_API_URL.')
}
