/**
 * Interactive CLI prompts using @inquirer/prompts.
 * Used for snapshot selection, multi-select filtering, and conflict resolution.
 */
import { select, checkbox, confirm } from '@inquirer/prompts'

/**
 * Let user pick a snapshot from a list interactively.
 */
export async function selectSnapshot(snapshots: string[]): Promise<string> {
  return select({
    message: 'Select a snapshot to rollback to:',
    choices: snapshots.map(s => ({
      name: s,
      value: s,
    }))
  })
}

/**
 * Let user pick which blocks/partials to include (for --only filtering).
 */
export async function selectComponents(
  blocks: string[],
  partials: string[],
  includeTheme: boolean
): Promise<string[]> {
  const choices = [
    ...blocks.map(name => ({ name: `Block: ${name}`, value: name })),
    ...partials.map(name => ({ name: `Partial: ${name}`, value: name })),
    ...(includeTheme ? [{ name: 'Theme', value: 'theme' }] : [])
  ]

  return checkbox({
    message: 'Select components to sync:',
    choices
  })
}

/**
 * Confirm a destructive action.
 */
export async function confirmAction(message: string): Promise<boolean> {
  return confirm({ message, default: false })
}
