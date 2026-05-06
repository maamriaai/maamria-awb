import axios, { AxiosError, AxiosInstance } from 'axios'
import { getApiKey, getApiUrl } from '../config/store.js'
import type {
  ApiEnvelope,
  ApiKeyValidationResponse,
  CatalogPage,
  GenerateRequest,
  GenerateResponseData,
  OptionItem,
} from './types.js'

// The base URL is treated as the single source of truth. In prod the
// reverse proxy at https://maamria.com/api-cli forwards to the FastAPI
// /v1 router; in dev users set MAAMRIA_API_URL=http://127.0.0.1:8010/v1
// directly. So we never inject a version segment ourselves.

export class ApiKeyMissingError extends Error {
  constructor() {
    super('Not logged in. Run `maamria-awb login` first.')
    this.name = 'ApiKeyMissingError'
  }
}

export class ApiError extends Error {
  status: number
  detail?: string
  constructor(status: number, message: string, detail?: string) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.detail = detail
  }
}

export interface ApiClientOptions {
  apiKeyOverride?: string | null
}

export const buildClient = (options: ApiClientOptions = {}): AxiosInstance => {
  const apiKey = getApiKey(options.apiKeyOverride)
  if (!apiKey) throw new ApiKeyMissingError()

  const baseURL = getApiUrl().replace(/\/+$/, '')
  const client = axios.create({
    baseURL,
    timeout: 60_000,
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
      'User-Agent': '@maamria/awb',
    },
  })

  client.interceptors.response.use(
    (r) => r,
    (error: AxiosError<{ detail?: string | { message?: string } }>) => {
      const status = error.response?.status ?? 0
      const data = error.response?.data
      let detail: string | undefined
      if (typeof data?.detail === 'string') detail = data.detail
      else if (data?.detail && typeof data.detail === 'object' && 'message' in data.detail) {
        detail = (data.detail as { message?: string }).message
      }
      const baseMessage =
        status === 401
          ? 'Invalid or revoked API key. Run `maamria-awb login` to reconnect.'
          : status >= 500
            ? 'Maamria AI server error. Please try again in a moment.'
            : detail || error.message || 'Request failed'
      throw new ApiError(status, baseMessage, detail)
    },
  )

  return client
}

export const validateApiKey = async (
  apiKeyOverride?: string,
): Promise<ApiKeyValidationResponse> => {
  const client = buildClient({ apiKeyOverride })
  const { data } = await client.get<ApiEnvelope<ApiKeyValidationResponse>>(
    '/api-keys/validate',
  )
  return data.data
}

export const fetchOptions = async () => {
  const client = buildClient()
  const { data } = await client.get<ApiEnvelope<Record<string, any>>>(
    '/ai-workspace-builder/cli/options',
  )
  return data.data
}

export const fetchTechCategories = async (): Promise<Array<{ id: string; label: string }>> => {
  const client = buildClient()
  const { data } = await client.get<ApiEnvelope<Array<{ id: string; label: string }>>>(
    '/ai-workspace-builder/cli/technology-categories',
  )
  return data.data || []
}

export const searchTechCatalog = async (params: {
  category?: string
  search?: string
  limit?: number
  offset?: number
}): Promise<CatalogPage<OptionItem>> => {
  const client = buildClient()
  const { data } = await client.get<ApiEnvelope<CatalogPage<OptionItem>>>(
    '/ai-workspace-builder/cli/technology-catalog',
    { params },
  )
  return data.data
}

export const searchClaudeFeatures = async (params: {
  feature_type?: string
  search?: string
  limit?: number
  offset?: number
}): Promise<CatalogPage<OptionItem>> => {
  const client = buildClient()
  const { data } = await client.get<ApiEnvelope<CatalogPage<OptionItem>>>(
    '/ai-workspace-builder/cli/claude-feature-catalog',
    { params },
  )
  return data.data
}

export const generateWorkspace = async (
  body: GenerateRequest,
): Promise<GenerateResponseData> => {
  const client = buildClient()
  // Backend uses camelCase aliases; send both shapes by mapping to its
  // expected keys here.
  const payload = {
    assistants: body.assistants,
    projectType: body.project_type,
    techStack: body.tech_stack,
    behaviorMode: body.behavior_mode,
    rules: body.rules,
    agents: body.agents,
    skills: body.skills,
    commands: body.commands,
    projectName: body.project_name,
    projectDescription: body.project_description ?? '',
    language: body.language ?? 'en',
  }
  const { data } = await client.post<ApiEnvelope<GenerateResponseData>>(
    '/ai-workspace-builder/cli/generate',
    payload,
  )
  return data.data
}
