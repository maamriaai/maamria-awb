import path from 'node:path'
import prompts from 'prompts'
import ora from 'ora'
import chalk from 'chalk'
import { ApiError, ApiKeyMissingError, generateWorkspace } from '../api/client.js'
import { runWizard } from '../prompts/wizard.js'
import { writeFiles } from '../writer/writeFiles.js'
import { banner, error, info, success, warn } from '../utils/logger.js'

interface InitOptions {
  yes?: boolean
}

export const initCommand = async (opts: InitOptions = {}): Promise<void> => {
  banner()
  const cwd = process.cwd()

  let result
  try {
    result = await runWizard(cwd)
  } catch (err) {
    if (err instanceof ApiKeyMissingError) {
      error(err.message)
      process.exit(1)
    }
    throw err
  }
  if (!result) {
    info('Cancelled.')
    return
  }

  console.log()
  info(chalk.bold('Summary'))
  console.log(`  ${chalk.dim('assistant      :')} ${result.assistants.join(', ')}`)
  console.log(`  ${chalk.dim('project type   :')} ${result.project_type}`)
  console.log(`  ${chalk.dim('mode           :')} ${result.behavior_mode}`)
  console.log(
    `  ${chalk.dim('tech / agents  :')} ${result.tech_stack.length} tech, ${result.agents.length} agents, ${result.skills.length} skills, ${result.commands.length} commands`,
  )
  console.log(`  ${chalk.dim('project        :')} ${result.project_name}`)
  console.log(`  ${chalk.dim('output dir     :')} ${result.output_dir}`)
  console.log()

  if (!opts.yes) {
    const { go } = await prompts({
      type: 'confirm',
      name: 'go',
      message: 'Generate workspace now?',
      initial: true,
    })
    if (!go) {
      info('Cancelled.')
      return
    }
  }

  const spinner = ora('Generating your AI workspace…').start()
  let response
  try {
    response = await generateWorkspace({
      assistants: result.assistants,
      project_type: result.project_type,
      tech_stack: result.tech_stack,
      behavior_mode: result.behavior_mode,
      rules: result.rules,
      agents: result.agents,
      skills: result.skills,
      commands: result.commands,
      project_name: result.project_name,
      project_description: result.project_description,
      language: result.language,
    })
    spinner.succeed(`Generated ${response.files_count} file${response.files_count === 1 ? '' : 's'}.`)
  } catch (err) {
    spinner.fail('Generation failed.')
    if (err instanceof ApiError) error(err.message)
    else if (err instanceof ApiKeyMissingError) error(err.message)
    else if (err instanceof Error) error(err.message)
    process.exit(1)
  }

  if (!response.files.length) {
    warn('Backend returned no files. Nothing to write.')
    return
  }

  const root = path.resolve(result.output_dir)
  console.log()
  info(`Writing into ${chalk.cyan(root)}`)
  const summary = await writeFiles({ root, files: response.files })

  console.log()
  success(`Wrote ${summary.written.length} file${summary.written.length === 1 ? '' : 's'}.`)
  if (summary.backedUp.length) info(`Backed up ${summary.backedUp.length} existing file${summary.backedUp.length === 1 ? '' : 's'} into .maamria-backups/`)
  if (summary.skipped.length) info(`Skipped ${summary.skipped.length} existing file${summary.skipped.length === 1 ? '' : 's'}.`)
  if (summary.rejected.length) warn(`Rejected ${summary.rejected.length} unsafe path${summary.rejected.length === 1 ? '' : 's'}.`)
  if (response.warnings?.length) {
    for (const w of response.warnings) warn(w)
  }

  console.log()
  console.log(chalk.bold('Files written:'))
  for (const p of summary.written) console.log(`  ${chalk.cyan('•')} ${p}`)
  console.log()
  info('Open your project with the AI assistant of your choice — your workspace instructions are ready.')
}
