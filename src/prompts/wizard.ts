import prompts from 'prompts'
import path from 'node:path'
import {
  fetchOptions,
  fetchTechCategories,
  searchClaudeFeatures,
  searchTechCatalog,
} from '../api/client.js'
import type { GenerateRequest } from '../api/types.js'
import { pickFromCatalog } from './categoryPicker.js'

const ASSISTANT_FALLBACK = [
  { value: 'claude-code', title: 'Claude Code' },
  { value: 'github-copilot', title: 'GitHub Copilot' },
  { value: 'chatgpt-project', title: 'ChatGPT Project' },
  { value: 'cursor', title: 'Cursor' },
  { value: 'windsurf', title: 'Windsurf' },
]

const PROJECT_TYPE_FALLBACK = [
  { value: 'saas', title: 'SaaS' },
  { value: 'ecommerce', title: 'E-commerce' },
  { value: 'backend-api', title: 'Backend API' },
  { value: 'frontend-app', title: 'Frontend app' },
  { value: 'ai-agent', title: 'AI Agent' },
  { value: 'custom', title: 'Custom' },
]

const MODE_CHOICES = [
  { value: 'safe', title: 'Safe — protect existing code, ask before risky changes' },
  { value: 'startup', title: 'Startup — move fast, generate practical MVP guidance' },
  { value: 'enterprise', title: 'Enterprise — strict rules, security, tests, docs' },
]

const RULE_CHOICES = [
  { value: 'ask_before_delete', title: 'Ask before deleting files', selected: true },
  { value: 'preserve_backward_compat', title: 'Preserve backward compatibility', selected: true },
  { value: 'never_expose_secrets', title: 'Never expose secrets', selected: true },
  { value: 'update_docs_after_change', title: 'Update documentation after code changes' },
  { value: 'follow_clean_architecture', title: 'Follow clean architecture' },
  { value: 'write_unit_tests', title: 'Write unit tests for new backend logic' },
  { value: 'explain_decisions', title: 'Explain architecture decisions' },
]

const optionChoices = (
  list: Array<{ id?: string; value?: string; label?: string; name?: string; title?: string }> | undefined,
  fallback: Array<{ value: string; title: string }>,
) => {
  if (!list || !list.length) return fallback
  return list
    .map((item) => ({
      value: (item.id || item.value || '').toString(),
      title: (item.label || item.name || item.title || item.id || '').toString(),
    }))
    .filter((c) => c.value)
}

export interface WizardResult extends GenerateRequest {
  output_dir: string
}

export const runWizard = async (cwd: string): Promise<WizardResult | null> => {
  // Fetch the static option catalog. If this fails the wizard still
  // works using the hard-coded fallbacks above — the user is just
  // limited to common assistants/project types.
  let options: Record<string, any> = {}
  try {
    options = await fetchOptions()
  } catch {
    options = {}
  }

  const { assistant } = await prompts({
    type: 'select',
    name: 'assistant',
    message: 'Which AI assistant do you want to prepare your project for?',
    choices: optionChoices(options.assistants, ASSISTANT_FALLBACK),
    initial: 0,
  })
  if (!assistant) return null

  const { project_type } = await prompts({
    type: 'select',
    name: 'project_type',
    message: 'What type of project are you building?',
    choices: optionChoices(options.project_types, PROJECT_TYPE_FALLBACK),
    initial: 0,
  })
  if (!project_type) return null

  // Tech stack — search-first per category.
  let categories: Array<{ id: string; label: string }> = []
  try {
    categories = await fetchTechCategories()
  } catch {
    categories = []
  }

  const tech_stack: string[] = []
  for (const category of categories) {
    const picks = await pickFromCatalog({
      title: `Add ${category.label} technologies?`,
      fetcher: (search, limit) =>
        searchTechCatalog({ category: category.id, search, limit }),
    })
    tech_stack.push(...picks)
  }

  const { mode } = await prompts({
    type: 'select',
    name: 'mode',
    message: 'How should the AI assistant behave?',
    choices: MODE_CHOICES,
    initial: 0,
  })
  if (!mode) return null

  const { rules } = await prompts({
    type: 'multiselect',
    name: 'rules',
    message: 'Select the rules you want the assistant to follow',
    choices: RULE_CHOICES,
    hint: 'space to toggle, enter to confirm',
    instructions: false,
  })
  const ruleMap: Record<string, boolean> = {}
  for (const choice of RULE_CHOICES) ruleMap[choice.value] = false
  for (const v of (rules as string[]) || []) ruleMap[v] = true

  const agents = await pickFromCatalog({
    title: 'Add specialized agents?',
    fetcher: (search, limit) =>
      searchClaudeFeatures({ feature_type: 'agent', search, limit }),
  })

  const skills = await pickFromCatalog({
    title: 'Add skills?',
    fetcher: (search, limit) =>
      searchClaudeFeatures({ feature_type: 'skill', search, limit }),
  })

  const commands = await pickFromCatalog({
    title: 'Add slash commands?',
    fetcher: (search, limit) =>
      searchClaudeFeatures({ feature_type: 'command', search, limit }),
  })

  const projectDefault = path.basename(cwd)
  const details = await prompts([
    {
      type: 'text',
      name: 'project_name',
      message: 'Project name',
      initial: projectDefault,
      validate: (v: string) => (v && v.trim().length > 0 ? true : 'Project name is required'),
    },
    {
      type: 'text',
      name: 'project_description',
      message: 'Short project description (optional)',
      initial: '',
    },
    {
      type: 'select',
      name: 'language',
      message: 'Language for generated instructions',
      choices: [
        { value: 'en', title: 'English' },
        { value: 'fr', title: 'Français' },
      ],
      initial: 0,
    },
    {
      type: 'text',
      name: 'output_dir',
      message: 'Output directory',
      initial: cwd,
    },
  ])
  if (!details.project_name) return null

  return {
    assistants: [assistant],
    project_type,
    tech_stack,
    behavior_mode: mode,
    rules: ruleMap,
    agents,
    skills,
    commands,
    project_name: details.project_name,
    project_description: details.project_description || '',
    language: details.language || 'en',
    output_dir: details.output_dir || cwd,
  }
}
