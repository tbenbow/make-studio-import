/**
 * CLI formatting helpers using chalk, ora, and cli-table3.
 */
import chalk from 'chalk'
import ora, { type Ora } from 'ora'
import Table from 'cli-table3'
import type { Changeset } from './diff.js'

export { chalk, ora, Table }

export const symbols = {
  create: chalk.green('+'),
  update: chalk.yellow('~'),
  delete: chalk.red('-'),
  check: chalk.green('✓'),
  warn: chalk.yellow('⚠'),
  error: chalk.red('✗'),
  info: chalk.blue('ℹ'),
}

export function spinner(text: string): Ora {
  return ora({ text, color: 'cyan' }).start()
}

/**
 * Format a changeset with colors for terminal output.
 */
export function formatChangesetColored(changeset: Changeset): string {
  const lines: string[] = []

  const blockCreates = changeset.blocks.filter(b => b.type === 'create')
  const blockUpdates = changeset.blocks.filter(b => b.type === 'update')
  const blockDeletes = changeset.blocks.filter(b => b.type === 'delete')

  if (changeset.blocks.length > 0) {
    lines.push(chalk.bold('Blocks:'))
    for (const b of blockCreates) {
      lines.push(`  ${symbols.create} ${chalk.green(b.name)}  (create)`)
    }
    for (const b of blockUpdates) {
      lines.push(`  ${symbols.update} ${chalk.yellow(b.name)}  (update: ${b.changes?.join(', ')})`)
    }
    for (const b of blockDeletes) {
      lines.push(`  ${symbols.delete} ${chalk.red(b.name)}  (remote only — delete with --delete)`)
    }
    lines.push('')
  }

  const partialCreates = changeset.partials.filter(p => p.type === 'create')
  const partialUpdates = changeset.partials.filter(p => p.type === 'update')
  const partialDeletes = changeset.partials.filter(p => p.type === 'delete')

  if (changeset.partials.length > 0) {
    lines.push(chalk.bold('Partials:'))
    for (const p of partialCreates) {
      lines.push(`  ${symbols.create} ${chalk.green(p.name)}  (create)`)
    }
    for (const p of partialUpdates) {
      lines.push(`  ${symbols.update} ${chalk.yellow(p.name)}  (update: ${p.changes?.join(', ')})`)
    }
    for (const p of partialDeletes) {
      lines.push(`  ${symbols.delete} ${chalk.red(p.name)}  (remote only — delete with --delete)`)
    }
    lines.push('')
  }

  if (changeset.themeChanges.length > 0) {
    lines.push(chalk.bold('Theme:'))
    for (const c of changeset.themeChanges.slice(0, 20)) {
      lines.push(formatThemeChange(c.path, c.remote, c.local))
    }
    if (changeset.themeChanges.length > 20) {
      lines.push(chalk.dim(`  ... and ${changeset.themeChanges.length - 20} more`))
    }
    lines.push('')
  }

  if (lines.length === 0) {
    lines.push(chalk.dim('No changes detected. Everything is in sync.'))
  }

  return lines.join('\n')
}

/**
 * Format a single theme change with visual diff.
 */
export function formatThemeChange(path: string, remote: unknown, local: unknown): string {
  const remoteStr = formatValue(remote)
  const localStr = formatValue(local)
  return `  ${symbols.update} ${chalk.cyan(path)}\n    ${chalk.red('- ' + remoteStr)}\n    ${chalk.green('+ ' + localStr)}`
}

function formatValue(val: unknown): string {
  if (val === undefined || val === null) return chalk.dim('(empty)')
  if (typeof val === 'string') {
    return val.length > 60 ? val.slice(0, 60) + '...' : val
  }
  const str = JSON.stringify(val)
  return str.length > 60 ? str.slice(0, 60) + '...' : str
}

/**
 * Format a summary table for status command.
 */
export function statusTable(data: Record<string, string | number>): string {
  const table = new Table({
    style: { head: ['cyan'] }
  })
  for (const [key, value] of Object.entries(data)) {
    table.push({ [key]: String(value) })
  }
  return table.toString()
}
