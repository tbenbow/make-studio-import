import fs from 'fs'
import { listSnapshots, loadSnapshot, rollbackFromSnapshot } from '../snapshot.js'
import { selectSnapshot } from '../prompts.js'
import {
  type CommandContext,
  getThemePath, output, requireApiConfig, confirm, MakeStudioClient
} from './context.js'

export async function rollbackCommand(ctx: CommandContext): Promise<void> {
  const { args, rootDir } = ctx

  const themeName = args.theme
  if (!themeName) {
    output({ error: '--theme is required' })
    process.exit(1)
  }
  const themePath = getThemePath(rootDir, themeName)
  if (!fs.existsSync(themePath)) {
    output({ error: `Theme '${themeName}' not found at ${themePath}` })
    process.exit(1)
  }

  let snapshotFile = args.snapshot
  if (!snapshotFile) {
    const snapshots = listSnapshots(themePath)
    if (snapshots.length === 0) {
      output({ error: 'No snapshots found' })
      process.exit(1)
    }
    // Interactive snapshot selection if stdin is a TTY
    if (process.stdin.isTTY) {
      snapshotFile = await selectSnapshot(snapshots)
    } else {
      output({
        message: 'Available snapshots (use --snapshot=<filename>):',
        snapshots
      })
      process.exit(0)
    }
  }

  const apiConfig = requireApiConfig(rootDir, args.env)
  const siteId = args.site || apiConfig.siteId
  const client = new MakeStudioClient(apiConfig.baseUrl, apiConfig.token)
  const deleteExtras = args.delete === 'true'

  console.log(`Loading snapshot: ${snapshotFile}`)
  const snapshot = loadSnapshot(themePath, snapshotFile)

  // Dry-run preview: show what will change
  const currentBlocks = await client.getBlocks(siteId)
  const { partials: currentPartials } = await client.getPartials(siteId)

  const snapshotBlockNames = new Set(snapshot.blocks.map(b => b.name))
  const snapshotPartialNames = new Set(snapshot.partials.map(p => p.name))
  const currentBlockNames = new Set(currentBlocks.map(b => b.name))
  const currentPartialNames = new Set(currentPartials.map(p => p.name))

  const blocksToRestore = snapshot.blocks.length
  const partialsToRestore = snapshot.partials.length
  const blocksToDelete = deleteExtras
    ? currentBlocks.filter(b => !snapshotBlockNames.has(b.name)).length
    : 0
  const partialsToDelete = deleteExtras
    ? currentPartials.filter(p => !snapshotPartialNames.has(p.name)).length
    : 0

  console.log(`\nRollback preview (snapshot from ${snapshot.capturedAt}):`)
  console.log(`  Blocks:   ${blocksToRestore} restore`)
  if (blocksToDelete > 0) {
    console.log(`            ${blocksToDelete} delete (not in snapshot)`)
  }
  console.log(`  Partials: ${partialsToRestore} restore`)
  if (partialsToDelete > 0) {
    console.log(`            ${partialsToDelete} delete (not in snapshot)`)
  }
  console.log(`  Theme:    ${snapshot.theme ? 'restore' : 'skip'}`)

  // Show blocks/partials that exist now but aren't in snapshot
  const extraBlocks = currentBlocks.filter(b => !snapshotBlockNames.has(b.name))
  const extraPartials = currentPartials.filter(p => !snapshotPartialNames.has(p.name))
  if (extraBlocks.length > 0 || extraPartials.length > 0) {
    console.log(`\n  Not in snapshot:`)
    for (const b of extraBlocks) {
      console.log(`    Block: ${b.name}${deleteExtras ? ' (will delete)' : ' (use --delete to remove)'}`)
    }
    for (const p of extraPartials) {
      console.log(`    Partial: ${p.name}${deleteExtras ? ' (will delete)' : ' (use --delete to remove)'}`)
    }
  }

  // Require confirmation
  const confirmed = await confirm('\nApply rollback? [y/N] ')
  if (!confirmed) {
    console.log('Aborted.')
    process.exit(0)
  }

  console.log(`\nRolling back site ${siteId}...`)
  const result = await rollbackFromSnapshot(client, siteId, snapshot)

  // Delete components not in snapshot (opt-in)
  let blocksDeleted = 0
  let partialsDeleted = 0
  if (deleteExtras) {
    for (const block of extraBlocks) {
      console.log(`  Deleting block not in snapshot: ${block.name}`)
      await client.deleteBlock(block._id)
      blocksDeleted++
    }
    for (const partial of extraPartials) {
      console.log(`  Deleting partial not in snapshot: ${partial.name}`)
      await client.deletePartial(partial._id)
      partialsDeleted++
    }
  }

  console.log(`\nRollback complete: ${result.blocks} blocks restored, ${result.partials} partials restored, theme: ${result.theme}`)
  if (blocksDeleted > 0 || partialsDeleted > 0) {
    console.log(`  Deleted: ${blocksDeleted} blocks, ${partialsDeleted} partials`)
  }
  process.exit(0)
}
