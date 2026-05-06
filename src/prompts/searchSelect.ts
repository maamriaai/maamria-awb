import prompts from 'prompts'
import chalk from 'chalk'
import type { CatalogPage, OptionItem } from '../api/types.js'

interface SearchSelectArgs {
  message: string
  fetcher: (search: string) => Promise<CatalogPage<OptionItem>>
  selected?: string[]
}

// Catalog items come from two backend services that don't share the same
// shape — the tech catalog uses {slug, name, ...} while the legacy
// options service uses {id, label, ...}. Pull the first usable identifier
// and label so the multiselect works for both.
const itemId = (item: any): string => {
  return (item?.slug || item?.id || item?.name || item?.label || '') as string
}

const itemLabel = (item: any): string => {
  return (item?.label || item?.name || item?.slug || item?.id || '') as string
}

const formatItem = (item: any): string => {
  const label = itemLabel(item)
  const desc = item?.description ? chalk.dim(` — ${String(item.description).slice(0, 70)}`) : ''
  return `${label}${desc}`
}

/**
 * Search-first multi-select. The user types a search query, picks any
 * matches, and can re-search until they're done. Avoids dumping
 * thousand-item lists into the terminal.
 *
 * Selections are tracked across rounds — if you re-search and the same
 * item shows up, it's pre-checked. To remove a previously selected item,
 * uncheck it in any round you see it in.
 */
export const searchSelect = async (
  args: SearchSelectArgs,
): Promise<string[]> => {
  const picked = new Map<string, any>()
  for (const id of args.selected || []) {
    if (id) picked.set(id, { id, name: id })
  }

  while (true) {
    const summary = picked.size
      ? chalk.cyan(`(${picked.size} selected)`)
      : chalk.dim('(none selected yet)')
    const { search } = await prompts({
      type: 'text',
      name: 'search',
      message: `${args.message} ${summary} — type to search, leave empty to finish:`,
    })
    const query = (search || '').trim()
    if (!query) break

    let page: CatalogPage<OptionItem>
    try {
      page = await args.fetcher(query)
    } catch (err) {
      console.log(chalk.red(`✗ search failed: ${(err as Error).message}`))
      continue
    }

    if (!page.items.length) {
      console.log(chalk.yellow(`! no matches for "${query}"`))
      continue
    }

    // Build a lookup table for this round so we can resolve the multiselect
    // result back to the originating catalog row.
    const byId = new Map<string, any>()
    const choices: prompts.Choice[] = []
    for (const item of page.items) {
      const id = itemId(item)
      if (!id) continue
      byId.set(id, item)
      choices.push({
        title: formatItem(item),
        value: id,
        selected: picked.has(id),
      })
    }

    if (!choices.length) {
      console.log(chalk.yellow(`! no usable items for "${query}"`))
      continue
    }

    const { picks } = await prompts({
      type: 'multiselect',
      name: 'picks',
      message: `Select items for "${query}" (space to toggle, enter to confirm)`,
      choices,
      hint: ' ',
      instructions: false,
    })

    if (!Array.isArray(picks)) continue

    // Apply this round: anything the user kept ticked stays/joins; anything
    // they unticked (that we offered as pre-selected) gets removed. We
    // never touch selections that weren't shown this round.
    const offered = new Set(byId.keys())
    const kept = new Set(picks as string[])
    for (const id of offered) {
      if (kept.has(id)) {
        picked.set(id, byId.get(id))
      } else if (picked.has(id)) {
        picked.delete(id)
      }
    }

    if (picked.size) {
      const labels = [...picked.values()].map(itemLabel).join(', ')
      console.log(chalk.dim(`  current selection: ${labels}`))
    }
  }

  return [...picked.keys()]
}
