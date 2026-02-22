import fs from 'fs'
import path from 'path'
import { saveSnapshot } from '../snapshot.js'
import { findPartialReferences } from '../validate.js'
import { Timer } from '../utils/timer.js'
import {
  type CommandContext,
  getThemePath, output, requireApiConfig, confirm,
  MakeStudioClient, computeChangeset,
  readLocalBlock, readLocalPartial, getComponentNames, formatChangeset
} from './context.js'

export async function syncCommand(ctx: CommandContext): Promise<void> {
  const { args, rootDir, logger } = ctx

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

  const apiConfig = requireApiConfig(rootDir, args.env)
  const siteId = args.site || apiConfig.siteId
  const client = new MakeStudioClient(apiConfig.baseUrl, apiConfig.token)

  const applyChanges = args.apply === 'true'
  const deleteRemoteOnly = args.delete === 'true'
  const forceSync = args.force === 'true'
  const batchMode = args.batch === 'true'
  const onlyFilter = args.only ? args.only.split(',').map(s => s.trim()) : null
  const syncStatePath = path.join(themePath, '.sync-state.json')

  const timer = new Timer()

  // 1. Fetch remote state
  timer.start('Fetch')
  console.log(`Fetching remote state for site ${siteId}...`)
  const [remoteSite, remoteBlocks, remotePartialsRes] = await Promise.all([
    client.getSite(siteId),
    client.getBlocks(siteId),
    client.getPartials(siteId)
  ])
  const remotePartials = remotePartialsRes.partials

  // 2. Read local theme files
  const blocksDir = path.join(themePath, 'converted', 'blocks')
  const partialsDir = path.join(themePath, 'converted', 'partials')
  const themeJsonPath = path.join(themePath, 'theme.json')

  const localBlockNames = getComponentNames(blocksDir)
  const localPartialNames = getComponentNames(partialsDir)
  const localBlocks = localBlockNames.map(name => readLocalBlock(blocksDir, name, logger))
  const localPartials = localPartialNames.map(name => readLocalPartial(partialsDir, name))

  let localTheme: Record<string, unknown> | null = null
  if (fs.existsSync(themeJsonPath)) {
    localTheme = JSON.parse(fs.readFileSync(themeJsonPath, 'utf-8'))
  }

  timer.stop()

  // 3. Compute diff
  timer.start('Diff')
  const changeset = computeChangeset(
    localBlocks, remoteBlocks,
    localPartials, remotePartials,
    localTheme, remoteSite.theme
  )

  // Filter to --only if specified
  if (onlyFilter) {
    changeset.blocks = changeset.blocks.filter(b => onlyFilter.includes(b.name))
    changeset.partials = changeset.partials.filter(p => onlyFilter.includes(p.name))
    if (!onlyFilter.includes('theme')) {
      changeset.themeChanges = []
    }
  }

  timer.stop()

  // 4. Display
  console.log('')
  console.log(formatChangeset(changeset))

  const creates = changeset.blocks.filter(b => b.type === 'create').length
    + changeset.partials.filter(p => p.type === 'create').length
  const updates = changeset.blocks.filter(b => b.type === 'update').length
    + changeset.partials.filter(p => p.type === 'update').length
  const deletes = changeset.blocks.filter(b => b.type === 'delete').length
    + changeset.partials.filter(p => p.type === 'delete').length
  const themeChanges = changeset.themeChanges.length

  console.log(`Summary: ${creates} create, ${updates} update, ${deletes} remote-only, ${themeChanges} theme changes`)

  if (!applyChanges) {
    console.log('\nDry run — no changes applied. Use --apply to sync.')
    process.exit(0)
  }

  // 5. Confirm before applying (skip with --batch)
  if (!batchMode) {
    const parts: string[] = []
    if (creates > 0) parts.push(`${creates} create`)
    if (updates > 0) parts.push(`${updates} update`)
    if (themeChanges > 0) parts.push(`${themeChanges} theme changes`)
    if (deleteRemoteOnly && deletes > 0) parts.push(`${deletes} DELETE`)

    let prompt = `\nApply ${parts.join(', ')}?`
    if (deleteRemoteOnly && deletes > 0) {
      prompt += ` (${deletes} blocks/partials will be permanently deleted)`
    }
    prompt += ' [y/N] '

    const confirmed = await confirm(prompt)
    if (!confirmed) {
      console.log('Aborted.')
      process.exit(0)
    }
  } else {
    console.log('\nBatch mode — applying all changes without confirmation.')
  }

  // 5b. Pull-before-push safety check
  if (!forceSync) {
    let syncState: { lastSync?: string; tokenId?: string } = {}
    if (fs.existsSync(syncStatePath)) {
      try {
        syncState = JSON.parse(fs.readFileSync(syncStatePath, 'utf-8'))
      } catch (err) {
        logger.warn('Failed to parse sync state, starting fresh', { file: syncStatePath, error: (err as Error).message })
      }
    }
    if (syncState.lastSync) {
      try {
        const recentActivity = await client.getActivityLog(siteId, { since: syncState.lastSync, limit: 10 })
        if (recentActivity.length > 0) {
          console.log(`\nWarning: ${recentActivity.length} remote change(s) since last sync (${syncState.lastSync}):`)
          for (const entry of recentActivity.slice(0, 5)) {
            console.log(`  ${entry.action} ${entry.entityType} "${entry.entityName || entry.entityId}" at ${entry.createdAt}`)
          }
          if (recentActivity.length > 5) {
            console.log(`  ... and ${recentActivity.length - 5} more`)
          }
          console.log('\nRun `npm run pull` first, or use --force to override.')
          process.exit(1)
        }
      } catch (err) {
        console.log('Warning: Could not check activity log:', (err as Error).message)
      }
    }
  }

  // 6. Re-fetch fresh remote state right before applying
  console.log('\nRe-fetching fresh remote state before applying...')
  const [freshSite, freshBlocks, freshPartialsRes] = await Promise.all([
    client.getSite(siteId),
    client.getBlocks(siteId),
    client.getPartials(siteId)
  ])
  const freshPartials = freshPartialsRes.partials

  // Save snapshot of the fresh state (what we're about to modify)
  console.log('Saving snapshot of current remote state...')
  const snapshotPath = saveSnapshot(themePath, {
    siteId,
    capturedAt: new Date().toISOString(),
    theme: freshSite.theme,
    blocks: freshBlocks,
    partials: freshPartials
  })
  console.log(`Snapshot saved: ${snapshotPath}`)

  // Re-compute diff against fresh state
  const freshChangeset = computeChangeset(
    localBlocks, freshBlocks,
    localPartials, freshPartials,
    localTheme, freshSite.theme
  )

  // Re-apply --only filter
  if (onlyFilter) {
    freshChangeset.blocks = freshChangeset.blocks.filter(b => onlyFilter.includes(b.name))
    freshChangeset.partials = freshChangeset.partials.filter(p => onlyFilter.includes(p.name))
    if (!onlyFilter.includes('theme')) {
      freshChangeset.themeChanges = []
    }
  }

  // 7. Apply changes
  timer.start('Apply')
  console.log('\nApplying changes...')

  // Theme — merge only changed keys into the remote theme
  if (localTheme && freshChangeset.themeChanges.length > 0) {
    console.log(`  Updating theme (${freshChangeset.themeChanges.length} changed keys)...`)
    const mergedTheme = { ...freshSite.theme }
    for (const change of freshChangeset.themeChanges) {
      const topKey = change.path.split('.')[0]
      mergedTheme[topKey] = (localTheme as Record<string, unknown>)[topKey]
    }
    await client.updateSiteTheme(siteId, mergedTheme)
    console.log('  Theme updated.')
  }

  // Block creates
  for (const change of freshChangeset.blocks.filter(b => b.type === 'create')) {
    const local = localBlocks.find(b => b.name === change.name)!
    console.log(`  Creating block: ${change.name}`)
    await client.createBlock({
      name: local.name,
      site_id: siteId,
      template: local.template,
      fields: local.fields,
      category: 'section'
    })
  }

  // Block updates — only send changed properties
  for (const change of freshChangeset.blocks.filter(b => b.type === 'update')) {
    const local = localBlocks.find(b => b.name === change.name)!
    console.log(`  Updating block: ${change.name} (${change.changes?.join(', ')})`)
    const patch: Record<string, unknown> = {}
    if (change.changes?.includes('template')) patch.template = local.template
    if (change.changes?.includes('fields')) patch.fields = local.fields
    if (change.changes?.includes('description')) patch.description = local.description
    if (change.changes?.includes('thumbnailType')) patch.thumbnailType = local.thumbnailType
    await client.updateBlock(change.remoteId!, patch)
  }

  // Block deletes (opt-in)
  if (deleteRemoteOnly) {
    for (const change of freshChangeset.blocks.filter(b => b.type === 'delete')) {
      console.log(`  Deleting block: ${change.name}`)
      await client.deleteBlock(change.remoteId!)
    }
  }

  // Partial creates
  for (const change of freshChangeset.partials.filter(p => p.type === 'create')) {
    const local = localPartials.find(p => p.name === change.name)!
    console.log(`  Creating partial: ${change.name}`)
    await client.createPartial({
      name: local.name,
      site_id: siteId,
      template: local.template
    })
  }

  // Partial updates
  for (const change of freshChangeset.partials.filter(p => p.type === 'update')) {
    const local = localPartials.find(p => p.name === change.name)!
    console.log(`  Updating partial: ${change.name}`)
    await client.updatePartial(change.remoteId!, {
      template: local.template
    })
  }

  // Partial deletes (opt-in) — warn if partial is used by blocks
  if (deleteRemoteOnly) {
    for (const change of freshChangeset.partials.filter(p => p.type === 'delete')) {
      const refs = findPartialReferences(blocksDir, change.name)
      if (refs.length > 0) {
        logger.warn(`Partial "${change.name}" is used by: ${refs.join(', ')}`)
      }
      console.log(`  Deleting partial: ${change.name}`)
      await client.deletePartial(change.remoteId!)
    }
  }

  // Update sync state
  fs.writeFileSync(syncStatePath, JSON.stringify({
    lastSync: new Date().toISOString(),
    tokenId: apiConfig.token.slice(0, 8)
  }, null, 2) + '\n')

  timer.stop()

  console.log(`\nSync ${timer.summary()}`)
  process.exit(0)
}
