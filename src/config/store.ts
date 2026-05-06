import Conf from 'conf'

// Production API base. The proxy at /api-cli forwards to the FastAPI
// router mounted under /v1 — the CLI never adds /v1 itself, so this
// URL is the single source of truth for path prefixing.
//
// In dev, point at the FastAPI app directly (which DOES use /v1):
//   MAAMRIA_API_URL=http://127.0.0.1:8010/v1
const DEFAULT_API_URL = 'https://maamria.com/api-cli'
export const DEV_API_URL = 'http://127.0.0.1:8010/v1'

interface CliConfig {
  apiUrl: string
  apiKey?: string
}

const store = new Conf<CliConfig>({
  projectName: 'maamria-ai',
  projectSuffix: '',
  defaults: {
    apiUrl: DEFAULT_API_URL,
  },
})

export const getApiUrl = (): string => {
  return process.env.MAAMRIA_API_URL?.trim() || store.get('apiUrl') || DEFAULT_API_URL
}

export const setApiUrl = (url: string): void => {
  store.set('apiUrl', url.replace(/\/+$/, ''))
}

/**
 * Resolve the API key to use for the current command.
 * Priority: explicit `--api-key` flag → MAAMRIA_API_KEY env → saved config.
 */
export const getApiKey = (override?: string | null): string | undefined => {
  if (override && override.trim()) return override.trim()
  const fromEnv = process.env.MAAMRIA_API_KEY?.trim()
  if (fromEnv) return fromEnv
  return store.get('apiKey')
}

export const saveApiKey = (key: string): void => {
  store.set('apiKey', key)
}

export const clearApiKey = (): void => {
  store.delete('apiKey')
}

export const hasSavedKey = (): boolean => {
  return Boolean(store.get('apiKey'))
}

export const configPath = (): string => store.path
