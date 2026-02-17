/**
 * Snapshot & Rollback
 * Saves pre-sync state for safety and supports restoring from snapshots.
 */
import fs from 'fs'
import path from 'path'
import type { ApiBlock, ApiPartial, MakeStudioClient } from './api.js'

export interface Snapshot {
  siteId: string
  capturedAt: string
  theme: Record<string, unknown>
  blocks: ApiBlock[]
  partials: ApiPartial[]
}

function getSnapshotsDir(themePath: string): string {
  return path.join(themePath, 'snapshots')
}

/**
 * Save a snapshot of the current remote state before applying changes.
 */
export function saveSnapshot(
  themePath: string,
  snapshot: Snapshot
): string {
  const dir = getSnapshotsDir(themePath)
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
  const filename = `${timestamp}.json`
  const filepath = path.join(dir, filename)

  fs.writeFileSync(filepath, JSON.stringify(snapshot, null, 2))
  return filepath
}

/**
 * List available snapshots for a theme.
 */
export function listSnapshots(themePath: string): string[] {
  const dir = getSnapshotsDir(themePath)
  if (!fs.existsSync(dir)) return []
  return fs.readdirSync(dir)
    .filter(f => f.endsWith('.json'))
    .sort()
    .reverse()
}

/**
 * Load a snapshot from disk.
 */
export function loadSnapshot(themePath: string, filename: string): Snapshot {
  const filepath = path.join(getSnapshotsDir(themePath), filename)
  return JSON.parse(fs.readFileSync(filepath, 'utf-8'))
}

/**
 * Rollback: restore remote state from a snapshot.
 */
export async function rollbackFromSnapshot(
  client: MakeStudioClient,
  siteId: string,
  snapshot: Snapshot
): Promise<{ blocks: number; partials: number; theme: boolean }> {
  let themeRestored = false
  let blocksRestored = 0
  let partialsRestored = 0

  // Restore theme
  if (snapshot.theme) {
    await client.updateSiteTheme(siteId, snapshot.theme)
    themeRestored = true
  }

  // Get current remote state
  const currentBlocks = await client.getBlocks(siteId)
  const { partials: currentPartials } = await client.getPartials(siteId)

  // Restore blocks: update existing, create missing
  const snapshotBlocksByName = new Map(snapshot.blocks.map(b => [b.name, b]))
  const currentBlocksByName = new Map(currentBlocks.map(b => [b.name, b]))

  for (const [name, snapshotBlock] of snapshotBlocksByName) {
    const current = currentBlocksByName.get(name)
    if (current) {
      await client.updateBlock(current._id, {
        template: snapshotBlock.template,
        fields: snapshotBlock.fields,
        description: snapshotBlock.description,
        thumbnailType: snapshotBlock.thumbnailType
      })
    } else {
      await client.createBlock({
        name: snapshotBlock.name,
        site_id: siteId,
        template: snapshotBlock.template,
        fields: snapshotBlock.fields,
        category: snapshotBlock.category
      })
    }
    blocksRestored++
  }

  // Restore partials
  const snapshotPartialsByName = new Map(snapshot.partials.map(p => [p.name, p]))
  const currentPartialsByName = new Map(currentPartials.map(p => [p.name, p]))

  for (const [name, snapshotPartial] of snapshotPartialsByName) {
    const current = currentPartialsByName.get(name)
    if (current) {
      await client.updatePartial(current._id, {
        template: snapshotPartial.template
      })
    } else {
      await client.createPartial({
        name: snapshotPartial.name,
        site_id: siteId,
        template: snapshotPartial.template
      })
    }
    partialsRestored++
  }

  return { blocks: blocksRestored, partials: partialsRestored, theme: themeRestored }
}
