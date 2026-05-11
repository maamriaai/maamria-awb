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
  selected_features?: string[]
  project_name: string
  project_description?: string
  language?: string
}

// /cli/recommend wire types — mirror the backend RecommendedItem shape.
export interface RecommendRequest {
  assistants: string[]
  projectType: string
  techStack: string[]
  behaviorMode: string
  rules: Record<string, boolean>
  projectDescription?: string
  language?: string
}

export interface RecommendedItem {
  canonical_slug: string
  display_slug: string
  feature_type: string
  name: string
  description: string
  score: number
  default_selected: boolean
  badge: string
  reasons: string[]
  target_path: string
}

export interface RecommendationsData {
  recommendations: RecommendedItem[]
  by_type: Record<string, string[]>
  fingerprint: string
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
