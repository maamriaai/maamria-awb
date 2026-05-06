import { clearApiKey, hasSavedKey } from '../config/store.js'
import { info, success } from '../utils/logger.js'

export const logoutCommand = async (): Promise<void> => {
  if (!hasSavedKey()) {
    info('No saved API key — nothing to do.')
    return
  }
  clearApiKey()
  success('You have been logged out from Maamria AI CLI.')
}
