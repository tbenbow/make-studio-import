/**
 * Shared context and helpers for CLI commands.
 */
import fs from 'fs'
import path from 'path'
import readline from 'readline'
import { MakeStudioClient } from '../api.js'
import { transformField, reverseField } from '../fields.js'
import { computeChangeset, type LocalBlock, type LocalPartial } from '../diff.js'
import { createLogger, type Logger } from '../logger.js'
import { resolveApiConfig } from '../config.js'

export { MakeStudioClient }
export { computeChangeset, type LocalBlock, type LocalPartial }
export { transformField, reverseField }
export { type Logger }

export interface CommandContext {
  args: Record<string, string>
  rootDir: string
  logger: Logger
}

export function getThemePath(rootDir: string, themeName: string): string {
  return path.join(rootDir, 'themes', themeName)
}

export function confirm(message: string): Promise<boolean> {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout })
  return new Promise(resolve => {
    rl.question(message, answer => {
      rl.close()
      resolve(answer.trim().toLowerCase() === 'y')
    })
  })
}

export function output(data: unknown) {
  console.log(JSON.stringify(data, null, 2))
}

export function requireApiConfig(rootDir?: string, envName?: string): { baseUrl: string; token: string; siteId: string } {
  // Try .make-studio.json first
  if (rootDir) {
    const fromConfig = resolveApiConfig(rootDir, envName)
    if (fromConfig) return fromConfig
  }

  // Fall back to environment variables
  const baseUrl = process.env.MAKE_STUDIO_URL
  const token = process.env.MAKE_STUDIO_TOKEN
  const siteId = process.env.MAKE_STUDIO_SITE
  if (!baseUrl || !token) {
    output({ error: 'MAKE_STUDIO_URL and MAKE_STUDIO_TOKEN environment variables are required' })
    process.exit(1)
  }
  if (!siteId) {
    output({ error: 'MAKE_STUDIO_SITE environment variable is required (or use --site)' })
    process.exit(1)
  }
  return { baseUrl, token, siteId }
}

export function readLocalBlock(blocksDir: string, name: string, logger: Logger): LocalBlock {
  const htmlPath = path.join(blocksDir, `${name}.html`)
  const jsonPath = path.join(blocksDir, `${name}.json`)

  const template = fs.existsSync(htmlPath) ? fs.readFileSync(htmlPath, 'utf-8') : ''

  let fields: unknown[] = []
  let description: string | undefined
  let thumbnailType: string | undefined

  if (fs.existsSync(jsonPath)) {
    try {
      const json = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'))
      if (json.fields && Array.isArray(json.fields)) {
        fields = json.fields.map(transformField)
      }
      if (json.description && typeof json.description === 'string') {
        description = json.description.slice(0, 30)
      }
      if (json.thumbnailType && typeof json.thumbnailType === 'string') {
        thumbnailType = json.thumbnailType
      }
    } catch (err) {
      logger.warn(`Failed to parse block JSON`, { file: jsonPath, error: (err as Error).message })
    }
  }

  return { name, template, fields, description, thumbnailType }
}

export function readLocalPartial(partialsDir: string, name: string): LocalPartial {
  const htmlPath = path.join(partialsDir, `${name}.html`)
  const template = fs.existsSync(htmlPath) ? fs.readFileSync(htmlPath, 'utf-8') : ''
  return { name, template }
}

export function getComponentNames(dir: string): string[] {
  if (!fs.existsSync(dir)) return []
  return fs.readdirSync(dir)
    .filter(f => f.endsWith('.html'))
    .map(f => f.replace('.html', ''))
}

export function formatChangeset(changeset: ReturnType<typeof computeChangeset>) {
  const lines: string[] = []

  const blockCreates = changeset.blocks.filter(b => b.type === 'create')
  const blockUpdates = changeset.blocks.filter(b => b.type === 'update')
  const blockDeletes = changeset.blocks.filter(b => b.type === 'delete')

  if (changeset.blocks.length > 0) {
    lines.push('Blocks:')
    for (const b of blockCreates) {
      lines.push(`  + ${b.name}  (create)`)
    }
    for (const b of blockUpdates) {
      lines.push(`  ~ ${b.name}  (update: ${b.changes?.join(', ')})`)
    }
    for (const b of blockDeletes) {
      lines.push(`  - ${b.name}  (remote only — delete with --delete)`)
    }
    lines.push('')
  }

  const partialCreates = changeset.partials.filter(p => p.type === 'create')
  const partialUpdates = changeset.partials.filter(p => p.type === 'update')
  const partialDeletes = changeset.partials.filter(p => p.type === 'delete')

  if (changeset.partials.length > 0) {
    lines.push('Partials:')
    for (const p of partialCreates) {
      lines.push(`  + ${p.name}  (create)`)
    }
    for (const p of partialUpdates) {
      lines.push(`  ~ ${p.name}  (update: ${p.changes?.join(', ')})`)
    }
    for (const p of partialDeletes) {
      lines.push(`  - ${p.name}  (remote only — delete with --delete)`)
    }
    lines.push('')
  }

  if (changeset.themeChanges.length > 0) {
    lines.push('Theme:')
    for (const c of changeset.themeChanges.slice(0, 20)) {
      const localStr = typeof c.local === 'string' ? c.local : JSON.stringify(c.local)
      const remoteStr = typeof c.remote === 'string' ? c.remote : JSON.stringify(c.remote)
      const truncLocal = localStr && localStr.length > 40 ? localStr.slice(0, 40) + '...' : localStr
      const truncRemote = remoteStr && remoteStr.length > 40 ? remoteStr.slice(0, 40) + '...' : remoteStr
      lines.push(`  ~ ${c.path}  (${truncRemote} → ${truncLocal})`)
    }
    if (changeset.themeChanges.length > 20) {
      lines.push(`  ... and ${changeset.themeChanges.length - 20} more`)
    }
    lines.push('')
  }

  if (lines.length === 0) {
    lines.push('No changes detected. Everything is in sync.')
  }

  return lines.join('\n')
}
