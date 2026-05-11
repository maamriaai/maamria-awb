// Non-interactive workspace generator.
//
// IMPORTANT: this CLI never computes scores, thresholds, or per-type caps.
// All recommendation logic lives in the backend RecommendationService and is
// surfaced via POST /v1/ai-workspace-builder/cli/recommend. Duplicating any
// of that here would silently drift from the web wizard — don't.
//
// Backward compatibility: when this command is invoked with no new flags
// (e.g. `maamria-awb generate` or `maamria-awb generate -y`), we delegate to
// the existing interactive `initCommand`. The new non-interactive flow only
// activates when at least one new flag is set.

import path from 'node:path'
import fs from 'fs-extra'
import prompts from 'prompts'
import ora from 'ora'
import chalk from 'chalk'
import {
  ApiError,
  ApiKeyMissingError,
  generateWorkspace,
  recommendWorkspace,
} from '../api/client.js'
import type {
  GeneratedFile,
  RecommendationsData,
  RecommendedItem,
} from '../api/types.js'
import { writeFiles, type ConflictMode } from '../writer/writeFiles.js'
import { banner, error, info, success, warn } from '../utils/logger.js'
import { initCommand } from './init.js'

// Wizard's three always-on rules. Mirrored here so the non-interactive flow
// starts from the same safe baseline as the wizard.
const DEFAULT_ON_RULES = [
  'ask_before_delete',
  'preserve_backward_compat',
  'never_expose_secrets',
] as const

// Known rule keys recognized by the wizard. Unknown keys passed via --rules
// are still forwarded as `true` so the backend can choose to honor them.
const KNOWN_RULE_KEYS = [
  ...DEFAULT_ON_RULES,
  'update_docs_after_change',
  'follow_clean_architecture',
  'write_unit_tests',
  'explain_decisions',
]

// Feature types that map onto WorkspaceInputSchema.selected_features rather
// than into agents/skills/commands. Sourced from the implementation plan §9.
const SELECTED_FEATURE_TYPES = new Set([
  'rule',
  'hook',
  'setting',
  'template',
  'memory',
  'documentation',
])

// Files we know the generator writes near the project root — used for the
// pre-flight overlap warning.
const PREFLIGHT_PATHS = ['CLAUDE.md', 'SOURCES.md', '.claude']

export interface GenerateOptions {
  assistant?: string
  projectType?: string
  stack?: string
  mode?: string
  rules?: string
  projectName?: string
  description?: string
  output?: string
  language?: string
  includeSuggestions?: boolean
  interactiveRecommendations?: boolean
  dryRun?: boolean
  preview?: boolean
  force?: boolean
  yes?: boolean
  // commander turns `--no-interactive` into `opts.interactive: boolean`
  // defaulting to `true`. We read `interactive === false` to detect the flag.
  interactive?: boolean
  apiKey?: string
}

const NEW_FLAG_KEYS: (keyof GenerateOptions)[] = [
  'assistant',
  'projectType',
  'stack',
  'mode',
  'rules',
  'projectName',
  'description',
  'output',
  'language',
  'includeSuggestions',
  'interactiveRecommendations',
  'dryRun',
  'preview',
  'force',
]

const hasAnyNewFlag = (opts: GenerateOptions): boolean => {
  if (NEW_FLAG_KEYS.some((k) => opts[k] !== undefined)) return true
  if (opts.interactive === false) return true
  return false
}

const parseCsv = (value?: string): string[] =>
  (value ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)

const buildRulesMap = (csv?: string): Record<string, boolean> => {
  const map: Record<string, boolean> = {}
  for (const k of KNOWN_RULE_KEYS) map[k] = false
  for (const k of DEFAULT_ON_RULES) map[k] = true
  for (const k of parseCsv(csv)) map[k] = true
  return map
}

const countsByType = (items: RecommendedItem[]): Record<string, number> => {
  const counts: Record<string, number> = {}
  for (const it of items) counts[it.feature_type] = (counts[it.feature_type] || 0) + 1
  return counts
}

const formatCountTable = (counts: Record<string, number>): string => {
  const entries = Object.entries(counts).sort(([a], [b]) => a.localeCompare(b))
  if (!entries.length) return '(none)'
  return entries.map(([k, v]) => `${v} ${k}${v === 1 ? '' : 's'}`).join(', ')
}

const resolveConflictMode = (opts: {
  yes: boolean
  force: boolean
  nonInteractive: boolean
}): ConflictMode => {
  if (opts.force) return 'overwrite'
  if (opts.yes || opts.nonInteractive) return 'skip'
  return 'ask'
}

const preflightWarn = async (
  outputDir: string,
  files: GeneratedFile[],
  flags: { yes: boolean; force: boolean },
): Promise<void> => {
  if (flags.force) return
  const present: string[] = []
  for (const p of PREFLIGHT_PATHS) {
    if (await fs.pathExists(path.join(outputDir, p))) present.push(p)
  }
  if (!present.length) return
  const overlap = files.filter((f) =>
    PREFLIGHT_PATHS.some(
      (w) =>
        f.path === w ||
        f.path.startsWith(w + '/') ||
        f.path.startsWith(w + path.sep),
    ),
  ).length
  if (!overlap) return
  const word = overlap === 1 ? 'file' : 'files'
  if (flags.yes) {
    info(
      `Pre-flight: ${present.join(', ')} already exists in ${outputDir}. ` +
        `${overlap} generated ${word} will be considered for conflict ` +
        `resolution (default mode: skip; pass --force to overwrite).`,
    )
  } else {
    warn(
      `${present.join(', ')} already exists in ${outputDir}. ` +
        `${overlap} generated ${word} may conflict — you will be prompted.`,
    )
  }
}

const printRecommendationSummary = (
  args: {
    assistant: string
    projectType: string
    mode: string
    stack: string[]
    rulesMap: Record<string, boolean>
  },
  defaults: RecommendedItem[],
  suggestions: RecommendedItem[],
  fingerprint: string,
): void => {
  console.log()
  info(chalk.bold('Recommendation summary'))
  console.log(`  ${chalk.dim('assistant     :')} ${args.assistant}`)
  console.log(`  ${chalk.dim('project type  :')} ${args.projectType || '(unset)'}`)
  console.log(`  ${chalk.dim('mode          :')} ${args.mode}`)
  console.log(
    `  ${chalk.dim('stack         :')} ${args.stack.join(', ') || '(none)'}`,
  )
  const rulesOn = Object.entries(args.rulesMap)
    .filter(([, v]) => v)
    .map(([k]) => k)
  console.log(`  ${chalk.dim('rules on      :')} ${rulesOn.join(', ') || '(none)'}`)
  console.log()
  console.log(
    `  ${chalk.dim('Recommended   :')} ${formatCountTable(countsByType(defaults))}`,
  )
  console.log(
    `  ${chalk.dim('Suggested     :')} ${formatCountTable(countsByType(suggestions))} ${chalk.dim('(opt-in)')}`,
  )
  console.log(`  ${chalk.dim('fingerprint   :')} ${fingerprint}`)
  console.log()

  // Top reasons for the first few default items — purely informational.
  const top = defaults.slice(0, 5)
  if (top.length) {
    info('Top reasons')
    for (const r of top) {
      const reason = r.reasons?.[0] || r.description?.slice(0, 80) || ''
      console.log(
        `  ${chalk.cyan('•')} ${chalk.bold(r.name)} ${chalk.dim('(' + r.feature_type + ')')}${
          reason ? ' — ' + reason : ''
        }`,
      )
    }
    console.log()
  }
}

const pickInteractiveSuggestions = async (
  suggestions: RecommendedItem[],
): Promise<Set<string>> => {
  const grouped = new Map<string, RecommendedItem[]>()
  for (const s of suggestions) {
    const arr = grouped.get(s.feature_type) || []
    arr.push(s)
    grouped.set(s.feature_type, arr)
  }
  const picked = new Set<string>()
  for (const [ftype, list] of grouped) {
    const response = await prompts({
      type: 'multiselect',
      name: 'picked',
      message: `Suggested ${ftype}s — toggle additions:`,
      choices: list.map((s) => ({
        title: `${s.name}${s.reasons?.[0] ? ' — ' + s.reasons[0] : ''}`,
        value: s.canonical_slug,
      })),
      hint: 'space to toggle, enter to confirm',
      instructions: false,
    })
    for (const slug of (response.picked as string[]) || []) picked.add(slug)
  }
  return picked
}

export const generateCommand = async (
  opts: GenerateOptions = {},
): Promise<void> => {
  // Backward-compat: no new flags → run the interactive wizard exactly as
  // today's `init` (and previously `generate` alias) does.
  if (!hasAnyNewFlag(opts)) {
    await initCommand({ yes: !!opts.yes })
    return
  }

  banner()

  const nonInteractive = opts.interactive === false
  const isInteractive = !nonInteractive && !opts.yes && Boolean(process.stdin.isTTY)
  const wantsInteractiveRecs = !!opts.interactiveRecommendations

  // ---- Phase 3-style validation ----
  if (!opts.assistant) {
    error('--assistant is required (e.g. --assistant claude-code).')
    process.exit(1)
  }
  if (!opts.stack) {
    error('--stack is required (e.g. --stack fastapi,vue-nuxt).')
    process.exit(1)
  }
  if (!opts.mode) {
    error('--mode is required (e.g. --mode enterprise).')
    process.exit(1)
  }
  if (wantsInteractiveRecs && (opts.yes || nonInteractive)) {
    error(
      '--interactive-recommendations cannot be combined with --yes or --no-interactive.',
    )
    process.exit(1)
  }

  const cwd = process.cwd()
  let projectName = (opts.projectName || '').trim()
  if (!projectName) {
    if (isInteractive) {
      const response = await prompts({
        type: 'text',
        name: 'value',
        message: 'Project name',
        initial: path.basename(cwd),
        validate: (s: string) =>
          s && s.trim().length > 0 ? true : 'Project name is required',
      })
      projectName = (response.value || '').trim()
      if (!projectName) {
        info('Cancelled.')
        return
      }
    } else if (opts.yes) {
      projectName = path.basename(cwd)
      warn(`--project-name not set; defaulting to "${projectName}".`)
    } else {
      error('--project-name is required when running non-interactively.')
      process.exit(1)
    }
  }

  if (!opts.projectType) {
    warn('--project-type not set; recommendations may be weaker.')
  }

  const techStack = parseCsv(opts.stack)
  const rulesMap = buildRulesMap(opts.rules)
  const projectDescription = (opts.description || '').trim()
  const language = (opts.language || 'en').trim()
  const outputDir = path.resolve(opts.output || cwd)

  // ---- Phase 4: /cli/recommend ----
  const recSpinner = ora('Fetching recommendations…').start()
  let recs: RecommendationsData
  try {
    recs = await recommendWorkspace({
      assistants: [opts.assistant],
      projectType: opts.projectType || '',
      techStack,
      behaviorMode: opts.mode,
      rules: rulesMap,
      projectDescription,
      language,
    })
    recSpinner.succeed(
      `Got ${recs.recommendations.length} recommendation${
        recs.recommendations.length === 1 ? '' : 's'
      }.`,
    )
  } catch (err) {
    recSpinner.fail('Recommendation request failed.')
    if (err instanceof ApiError) error(err.message)
    else if (err instanceof ApiKeyMissingError) error(err.message)
    else if (err instanceof Error) error(err.message)
    process.exit(1)
  }

  const defaults = recs!.recommendations.filter((r) => r.default_selected)
  const suggestions = recs!.recommendations.filter((r) => !r.default_selected)

  printRecommendationSummary(
    {
      assistant: opts.assistant,
      projectType: opts.projectType || '',
      mode: opts.mode,
      stack: techStack,
      rulesMap,
    },
    defaults,
    suggestions,
    recs!.fingerprint,
  )

  // ---- Phase 5: payload build ----
  let chosen: RecommendedItem[] = [...defaults]
  if (opts.includeSuggestions && suggestions.length) {
    chosen = chosen.concat(suggestions)
    info(
      `Including ${suggestions.length} suggested item${
        suggestions.length === 1 ? '' : 's'
      } (--include-suggestions).`,
    )
  } else if (
    wantsInteractiveRecs &&
    suggestions.length &&
    Boolean(process.stdin.isTTY)
  ) {
    const picked = await pickInteractiveSuggestions(suggestions)
    for (const s of suggestions) {
      if (picked.has(s.canonical_slug)) chosen.push(s)
    }
  }

  const slugsByType = (ft: string): string[] =>
    chosen.filter((r) => r.feature_type === ft).map((r) => r.canonical_slug)

  const selectedFeatures = chosen
    .filter((r) => SELECTED_FEATURE_TYPES.has(r.feature_type))
    .map((r) => r.canonical_slug)

  const generatePayload = {
    assistants: [opts.assistant],
    project_type: opts.projectType || '',
    tech_stack: techStack,
    behavior_mode: opts.mode,
    rules: rulesMap,
    agents: slugsByType('agent'),
    skills: slugsByType('skill'),
    commands: slugsByType('command'),
    selected_features: selectedFeatures,
    project_name: projectName,
    project_description: projectDescription,
    language,
  }

  // ---- Phase 6: dry-run / preview / generate ----
  if (opts.dryRun) {
    info(chalk.bold('Dry run — no /cli/generate call, no files written.'))
    console.log()
    console.log(
      chalk.dim('Resolved payload (sent to /cli/generate when not --dry-run):'),
    )
    console.log(JSON.stringify(generatePayload, null, 2))
    return
  }

  if (opts.preview) {
    warn(
      '--preview still calls /cli/generate today, which records the workspace ' +
        'in your generation history. No files will be written to disk.',
    )
  }

  const genSpinner = ora('Generating your AI workspace…').start()
  let response
  try {
    response = await generateWorkspace(generatePayload)
    genSpinner.succeed(
      `Generated ${response.files_count} file${
        response.files_count === 1 ? '' : 's'
      }.`,
    )
  } catch (err) {
    genSpinner.fail('Generation failed.')
    if (err instanceof ApiError) error(err.message)
    else if (err instanceof ApiKeyMissingError) error(err.message)
    else if (err instanceof Error) error(err.message)
    process.exit(1)
  }

  if (response!.warnings?.length) {
    for (const w of response!.warnings) warn(w)
  }

  if (opts.preview) {
    console.log()
    info(
      chalk.bold(
        `Preview — ${response!.files.length} file${
          response!.files.length === 1 ? '' : 's'
        } (not written):`,
      ),
    )
    for (const f of response!.files) {
      const sizeKb = (Buffer.byteLength(f.content, 'utf8') / 1024).toFixed(1)
      console.log(`  ${chalk.cyan('•')} ${f.path} ${chalk.dim('(' + sizeKb + ' KB)')}`)
    }
    return
  }

  if (!response!.files.length) {
    warn('Backend returned no files. Nothing to write.')
    return
  }

  // ---- Phase 7: safe file writing ----
  await preflightWarn(outputDir, response!.files, {
    yes: !!opts.yes,
    force: !!opts.force,
  })

  const conflict = resolveConflictMode({
    yes: !!opts.yes,
    force: !!opts.force,
    nonInteractive,
  })

  console.log()
  info(`Writing into ${chalk.cyan(outputDir)} ${chalk.dim('(conflict: ' + conflict + ')')}`)
  const summary = await writeFiles({
    root: outputDir,
    files: response!.files,
    conflict,
  })

  console.log()
  success(`Wrote ${summary.written.length} file${summary.written.length === 1 ? '' : 's'}.`)
  if (summary.backedUp.length) {
    info(
      `Backed up ${summary.backedUp.length} existing file${
        summary.backedUp.length === 1 ? '' : 's'
      } into .maamria-backups/`,
    )
  }
  if (summary.skipped.length) {
    info(
      `Skipped ${summary.skipped.length} existing file${
        summary.skipped.length === 1 ? '' : 's'
      }.`,
    )
  }
  if (summary.rejected.length) {
    warn(
      `Rejected ${summary.rejected.length} unsafe path${
        summary.rejected.length === 1 ? '' : 's'
      }.`,
    )
  }

  const includedCounts = countsByType(chosen)
  const includedSummary = formatCountTable(includedCounts)
  if (includedSummary !== '(none)') info(`Included: ${includedSummary}.`)

  if (summary.written.length) {
    console.log()
    console.log(chalk.bold('Files written:'))
    for (const p of summary.written) console.log(`  ${chalk.cyan('•')} ${p}`)
  }
  console.log()
  info(
    'Open your project with the AI assistant of your choice — your workspace instructions are ready.',
  )
}
