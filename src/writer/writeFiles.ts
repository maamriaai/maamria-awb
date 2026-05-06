import fs from 'fs-extra'
import path from 'node:path'
import prompts from 'prompts'
import chalk from 'chalk'
import type { GeneratedFile } from '../api/types.js'
import { resolveSafe } from './safePaths.js'

export type ConflictMode = 'ask' | 'overwrite' | 'skip' | 'backup'

export interface WriteSummary {
  written: string[]
  skipped: string[]
  backedUp: string[]
  rejected: string[]
}

interface WriteOptions {
  root: string
  files: GeneratedFile[]
  conflict?: ConflictMode
}

const ts = (): string =>
  new Date()
    .toISOString()
    .replace(/[-:]/g, '')
    .replace(/\..+/, '')
    .replace('T', '-')

const promptForExisting = async (
  rel: string,
): Promise<'overwrite' | 'skip' | 'backup' | 'cancel' | 'overwrite_all' | 'skip_all' | 'backup_all'> => {
  const { choice } = await prompts({
    type: 'select',
    name: 'choice',
    message: `${chalk.yellow('!')} ${chalk.bold(rel)} already exists. What should we do?`,
    choices: [
      { title: 'Overwrite this file', value: 'overwrite' },
      { title: 'Skip this file', value: 'skip' },
      { title: 'Back up the existing file, then write', value: 'backup' },
      { title: 'Overwrite ALL remaining conflicts', value: 'overwrite_all' },
      { title: 'Skip ALL remaining conflicts', value: 'skip_all' },
      { title: 'Back up ALL remaining conflicts', value: 'backup_all' },
      { title: 'Cancel — stop writing files', value: 'cancel' },
    ],
    initial: 2,
  })
  return choice ?? 'cancel'
}

export const writeFiles = async ({
  root,
  files,
  conflict = 'ask',
}: WriteOptions): Promise<WriteSummary> => {
  const summary: WriteSummary = { written: [], skipped: [], backedUp: [], rejected: [] }
  const backupDir = path.join(root, '.maamria-backups', ts())
  let mode: ConflictMode = conflict

  for (const file of files) {
    let abs: string
    try {
      abs = resolveSafe(root, file.path)
    } catch {
      summary.rejected.push(file.path)
      continue
    }

    const exists = await fs.pathExists(abs)
    if (exists) {
      let decision: 'overwrite' | 'skip' | 'backup' | 'cancel' = 'skip'
      if (mode === 'ask') {
        const choice = await promptForExisting(file.path)
        if (choice === 'cancel') break
        if (choice === 'overwrite_all') {
          mode = 'overwrite'
          decision = 'overwrite'
        } else if (choice === 'skip_all') {
          mode = 'skip'
          decision = 'skip'
        } else if (choice === 'backup_all') {
          mode = 'backup'
          decision = 'backup'
        } else {
          decision = choice
        }
      } else if (mode === 'overwrite') {
        decision = 'overwrite'
      } else if (mode === 'skip') {
        decision = 'skip'
      } else if (mode === 'backup') {
        decision = 'backup'
      }

      if (decision === 'skip') {
        summary.skipped.push(file.path)
        continue
      }
      if (decision === 'backup') {
        const backupTarget = path.join(backupDir, file.path)
        await fs.ensureDir(path.dirname(backupTarget))
        await fs.copy(abs, backupTarget, { overwrite: true })
        summary.backedUp.push(file.path)
      }
    }

    await fs.ensureDir(path.dirname(abs))
    await fs.writeFile(abs, file.content, 'utf8')
    summary.written.push(file.path)
  }

  return summary
}
