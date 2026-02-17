/**
 * Diff Engine
 * Compares local theme files against remote API state to produce a changeset.
 */
import type { ApiBlock, ApiPartial } from './api.js'

export interface LocalBlock {
  name: string
  template: string
  fields: unknown[]
  description?: string
  thumbnailType?: string
}

export interface LocalPartial {
  name: string
  template: string
}

export interface BlockChange {
  type: 'create' | 'update' | 'delete'
  name: string
  remoteId?: string
  changes?: string[]  // e.g. ['template', 'fields', 'description']
}

export interface PartialChange {
  type: 'create' | 'update' | 'delete'
  name: string
  remoteId?: string
  changes?: string[]
}

export interface ThemeFieldChange {
  path: string
  local: unknown
  remote: unknown
}

export interface Changeset {
  blocks: BlockChange[]
  partials: PartialChange[]
  themeChanges: ThemeFieldChange[]
}

/**
 * Deep-compare two values. Returns true if they differ.
 */
function isDifferent(a: unknown, b: unknown): boolean {
  if (a === b) return false
  if (a === undefined && b === undefined) return false
  if (a === null && b === null) return false
  if (typeof a !== typeof b) return true
  if (typeof a !== 'object' || a === null || b === null) return a !== b

  const aStr = JSON.stringify(a)
  const bStr = JSON.stringify(b)
  return aStr !== bStr
}

/**
 * Normalize a template string for comparison.
 * The API sanitizes HTML (e.g. adds closing tags, normalizes whitespace in attributes),
 * so we normalize both sides before comparing.
 */
function normalizeTemplate(t: string): string {
  return t
    .replace(/\r\n/g, '\n')                       // normalize line endings
    .replace(/[ \t]+\n/g, '\n')                    // trim trailing whitespace per line
    .replace(/\s*\/>/g, '>')                       // normalize self-closing tags (sanitizer strips />)
    .replace(/<(\w+)([^>]*)><\/\1>/g, '<$1$2>')    // collapse <tag ...></tag> → <tag ...>
    .replace(/&ldquo;/g, '\u201c')                 // sanitizer decodes HTML entities
    .replace(/&rdquo;/g, '\u201d')
    .replace(/&lsquo;/g, '\u2018')
    .replace(/&rsquo;/g, '\u2019')
    .replace(/&mdash;/g, '\u2014')
    .replace(/&ndash;/g, '\u2013')
    .replace(/&amp;/g, '&')                        // sanitizer decodes &amp; in attribute values
    .trim()
}

/**
 * Strip volatile `id` fields from block fields for comparison.
 * Field IDs are UUIDs generated fresh each read, so they always differ.
 * Compare by structure: name, type, value, config.
 */
function stripIds(arr: unknown[]): unknown[] {
  return arr.map(item => {
    if (typeof item !== 'object' || item === null) return item
    const { id, _id, ...rest } = item as Record<string, unknown>
    return rest
  })
}

function stripFieldVolatile(fields: unknown[]): unknown[] {
  return fields.map(f => {
    if (typeof f !== 'object' || f === null) return f
    const { id, _id, ...rest } = f as Record<string, unknown>
    // Strip IDs from items-type value arrays
    if (Array.isArray(rest.value)) {
      rest.value = stripIds(rest.value)
    }
    // Strip empty config objects (local adds config: {}, remote omits it)
    if (rest.config && typeof rest.config === 'object') {
      const configObj = rest.config as Record<string, unknown>
      if (configObj.fields) {
        rest.config = {
          ...configObj,
          fields: stripFieldVolatile(configObj.fields as unknown[])
        }
      } else if (Object.keys(configObj).length === 0) {
        delete rest.config
      }
    }
    return rest
  })
}

/**
 * Collect paths that differ between two objects.
 */
function diffPaths(local: Record<string, unknown>, remote: Record<string, unknown>, prefix = ''): ThemeFieldChange[] {
  const changes: ThemeFieldChange[] = []
  const allKeys = new Set([...Object.keys(local), ...Object.keys(remote)])

  for (const key of allKeys) {
    const path = prefix ? `${prefix}.${key}` : key
    const lVal = local[key]
    const rVal = remote[key]

    if (
      lVal && rVal &&
      typeof lVal === 'object' && typeof rVal === 'object' &&
      !Array.isArray(lVal) && !Array.isArray(rVal)
    ) {
      changes.push(...diffPaths(lVal as Record<string, unknown>, rVal as Record<string, unknown>, path))
    } else if (isDifferent(lVal, rVal)) {
      changes.push({ path, local: lVal, remote: rVal })
    }
  }

  return changes
}

export function diffTheme(
  localTheme: Record<string, unknown>,
  remoteTheme: Record<string, unknown>
): ThemeFieldChange[] {
  return diffPaths(localTheme, remoteTheme)
}

export function diffBlocks(
  localBlocks: LocalBlock[],
  remoteBlocks: ApiBlock[]
): BlockChange[] {
  const changes: BlockChange[] = []
  const remoteByName = new Map(remoteBlocks.map(b => [b.name, b]))

  // Check local blocks against remote
  for (const local of localBlocks) {
    const remote = remoteByName.get(local.name)
    if (!remote) {
      changes.push({ type: 'create', name: local.name })
    } else {
      const fieldChanges: string[] = []
      if (isDifferent(normalizeTemplate(local.template), normalizeTemplate(remote.template || ''))) {
        fieldChanges.push('template')
      }
      if (isDifferent(stripFieldVolatile(local.fields), stripFieldVolatile(remote.fields || []))) {
        fieldChanges.push('fields')
      }
      if (local.description !== undefined && isDifferent(local.description, remote.description)) {
        fieldChanges.push('description')
      }
      if (local.thumbnailType !== undefined && isDifferent(local.thumbnailType, remote.thumbnailType)) {
        fieldChanges.push('thumbnailType')
      }
      if (fieldChanges.length > 0) {
        changes.push({
          type: 'update',
          name: local.name,
          remoteId: remote._id,
          changes: fieldChanges
        })
      }
    }
  }

  // Check for remote-only blocks (candidates for deletion)
  const localNames = new Set(localBlocks.map(b => b.name))
  for (const remote of remoteBlocks) {
    if (!localNames.has(remote.name)) {
      changes.push({
        type: 'delete',
        name: remote.name,
        remoteId: remote._id
      })
    }
  }

  return changes
}

export function diffPartials(
  localPartials: LocalPartial[],
  remotePartials: ApiPartial[]
): PartialChange[] {
  const changes: PartialChange[] = []
  const remoteByName = new Map(remotePartials.map(p => [p.name, p]))

  for (const local of localPartials) {
    const remote = remoteByName.get(local.name)
    if (!remote) {
      changes.push({ type: 'create', name: local.name })
    } else {
      if (isDifferent(normalizeTemplate(local.template), normalizeTemplate(remote.template || ''))) {
        changes.push({
          type: 'update',
          name: local.name,
          remoteId: remote._id,
          changes: ['template']
        })
      }
    }
  }

  const localNames = new Set(localPartials.map(p => p.name))
  for (const remote of remotePartials) {
    if (!localNames.has(remote.name)) {
      changes.push({
        type: 'delete',
        name: remote.name,
        remoteId: remote._id
      })
    }
  }

  return changes
}

export function computeChangeset(
  localBlocks: LocalBlock[],
  remoteBlocks: ApiBlock[],
  localPartials: LocalPartial[],
  remotePartials: ApiPartial[],
  localTheme: Record<string, unknown> | null,
  remoteTheme: Record<string, unknown> | null
): Changeset {
  return {
    blocks: diffBlocks(localBlocks, remoteBlocks),
    partials: diffPartials(localPartials, remotePartials),
    themeChanges: (localTheme && remoteTheme) ? diffTheme(localTheme, remoteTheme) : []
  }
}
