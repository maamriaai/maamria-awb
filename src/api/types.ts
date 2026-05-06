// Wire types shared with the FastAPI backend (router/AiWorkspaceBuilder/CliWorkspaceController.py).
// Keep in sync with WorkspaceInputSchema on the Python side.

export interface ApiKeyValidationResponse {
  valid: boolean
  user: {
    id: string
    email?: string
    username?: string
  }
  auth_method: 'api_key'
}

export interface OptionItem {
  id: string
  label?: string
  name?: string
  description?: string
}

export interface CategoryItem {
  id: string
  label: string
  count?: number
}

export interface CatalogPage<T = OptionItem> {
  items: T[]
  total: number
  limit: number
  offset: number
  has_more: boolean
}

export interface GenerateRequest {
  assistants: string[]
  project_type: string
  tech_stack: string[]
  behavior_mode: string
  rules: Record<string, boolean>
  agents: string[]
  skills: string[]
  commands: string[]
  project_name: string
  project_description?: string
  language?: string
}

export interface GeneratedFile {
  path: string
  content: string
}

export interface GenerateResponseData {
  id?: string
  project_name: string
  assistants: string[]
  project_type: string
  files_count: number
  files: GeneratedFile[]
  warnings: string[]
  generated_at: string
}

export interface ApiEnvelope<T> {
  success: boolean
  data: T
}
