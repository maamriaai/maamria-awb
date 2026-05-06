import prompts from 'prompts'
import chalk from 'chalk'
import type { CatalogPage, OptionItem } from '../api/types.js'

interface PickFromCatalogArgs {
  /** Headline shown above the picker. */
  title: string
  /** Backend search function. Called once with `''` to load the initial set. */
  fetcher: (search: string, limit: number) => Promise<CatalogPage<OptionItem>>
  /**
   * How many rows to pre-fetch. Local live-filter operates on this set, so
   * pick high enough to cover the catalog comfortably. Default 200.
   */
  fetchLimit?: number
  /** Visible window inside the picker. Default 7. */
  optionsPerPage?: number
}

const SKIP_SENTINEL = '__skip__'

const itemId = (item: any): string =>
  (item?.slug || item?.id || item?.name || item?.label || '') as string

const itemLabel = (item: any): string =>
  (item?.label || item?.name || item?.slug || item?.id || '') as string

const formatItem = (item: any): string => {
  const label = itemLabel(item)
  const desc = item?.description ? chalk.dim(` — ${String(item.description).slice(0, 80)}`) : ''
  return `${label}${desc}`
}

/**
 * Live-filter, multi-select picker for one catalog category.
 *
 * Renders:
 *   ❯ — Skip this category —
 *     Item 1
 *     Item 2
 *     …
 *
 * Behaviour:
 *   - Type to filter the visible list as you go (no Enter needed).
 *   - Space toggles selection on the focused row.
 *   - Enter confirms.
 *   - Picking "— Skip —" (alone or together with anything) clears the
 *     selection: the category is treated as skipped.
 *   - Hitting Enter with nothing ticked is also treated as skip.
 */
export const pickFromCatalog = async ({
  title,
  fetcher,
  fetchLimit = 200,
  optionsPerPage = 7,
}: PickFromCatalogArgs): Promise<string[]> => {
  let page: CatalogPage<OptionItem>
  try {
    page = await fetcher('', fetchLimit)
  } catch (err) {
    console.log(chalk.red(`✗ failed to load ${title}: ${(err as Error).message}`))
    return []
  }

  const seen = new Set<string>()
  const choices: prompts.Choice[] = [
    {
      title: chalk.dim('— Skip this category —'),
      value: SKIP_SENTINEL,
    },
  ]

  for (const item of page.items || []) {
    const id = itemId(item)
    if (!id || seen.has(id)) continue
    seen.add(id)
    choices.push({ title: formatItem(item), value: id })
  }

  if (seen.size === 0) {
    console.log(chalk.dim(`  no items available for ${title}, skipping.`))
    return []
  }

  const more = page.has_more ? chalk.dim(` (${page.total} total — type to filter)`) : ''
  const { picks } = await prompts({
    type: 'autocompleteMultiselect',
    name: 'picks',
    message: `${title}${more}`,
    choices,
    hint: ' ',
    instructions: false,
    optionsPerPage,
    min: 0,
  } as any)

  if (!Array.isArray(picks)) return []
  if ((picks as string[]).includes(SKIP_SENTINEL)) return []
  return (picks as string[]).filter((v) => v && v !== SKIP_SENTINEL)
}
