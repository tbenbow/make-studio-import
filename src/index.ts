#!/usr/bin/env node
import fs from 'fs'
import path from 'path'
import crypto from 'crypto'
import { fileURLToPath } from 'url'
import readline from 'readline'
import dotenv from 'dotenv'
import { validate } from './validate.js'
import { MakeStudioClient } from './api.js'
import { computeChangeset, type LocalBlock, type LocalPartial } from './diff.js'
import { saveSnapshot, listSnapshots, loadSnapshot, rollbackFromSnapshot } from './snapshot.js'
import { transformField, reverseField } from './fields.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT_DIR = path.resolve(__dirname, '..')

// Load env from project root
dotenv.config({ path: path.join(ROOT_DIR, '.env') })

function parseArgs(args: string[]): Record<string, string> {
  const result: Record<string, string> = {}
  for (const arg of args) {
    if (arg.startsWith('--')) {
      const [key, value] = arg.slice(2).split('=')
      result[key] = value || 'true'
    }
  }
  return result
}

function getThemePath(themeName: string): string {
  return path.join(ROOT_DIR, 'themes', themeName)
}

function confirm(message: string): Promise<boolean> {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout })
  return new Promise(resolve => {
    rl.question(message, answer => {
      rl.close()
      resolve(answer.trim().toLowerCase() === 'y')
    })
  })
}

function output(data: unknown) {
  console.log(JSON.stringify(data, null, 2))
}

function requireApiConfig(): { baseUrl: string; token: string; siteId: string } {
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

// ─── Local file reading ───

function readLocalBlock(blocksDir: string, name: string): LocalBlock {
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
    } catch {}
  }

  return { name, template, fields, description, thumbnailType }
}

function readLocalPartial(partialsDir: string, name: string): LocalPartial {
  const htmlPath = path.join(partialsDir, `${name}.html`)
  const template = fs.existsSync(htmlPath) ? fs.readFileSync(htmlPath, 'utf-8') : ''
  return { name, template }
}

function getComponentNames(dir: string): string[] {
  if (!fs.existsSync(dir)) return []
  return fs.readdirSync(dir)
    .filter(f => f.endsWith('.html'))
    .map(f => f.replace('.html', ''))
}

// ─── Display helpers ───

function formatChangeset(changeset: ReturnType<typeof computeChangeset>) {
  const lines: string[] = []

  // Blocks
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

  // Partials
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

  // Theme
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

async function main() {
  const [command, ...rest] = process.argv.slice(2)
  const args = parseArgs(rest)

  if (!command || command === 'help' || command === '--help') {
    output({
      commands: {
        sync: 'Sync theme to Make Studio via API (dry run by default)',
        pull: 'Pull remote state into local theme files',
        validate: 'Validate converted files',
        status: 'Show theme status',
        'setup-pages': 'Create/update pages and layouts from pages.json manifest',
        'create-site': 'Create a new Make Studio site and save credentials to .env',
        rollback: 'Rollback to a previous snapshot'
      },
      options: {
        '--theme': 'Theme name (required for sync/pull/validate/status/setup-pages)',
        '--site': 'Site ID (overrides MAKE_STUDIO_SITE env var)',
        '--apply': 'Apply changes (sync only — default is dry run)',
        '--force': 'Skip pull-before-push safety check (sync only)',
        '--delete': 'Delete remote-only blocks/partials (with --apply)',
        '--batch': 'Skip individual confirmations, apply all changes at once (with --apply)',
        '--only': 'Comma-separated list of block/partial names to sync or pull (use "theme" for theme)',
        '--name': 'New site name (for create-site)',
        '--snapshot': 'Snapshot filename (for rollback)'
      }
    })
    return
  }

  switch (command) {

    // ═══════════════════════════════════════
    // sync — API-based theme sync (primary)
    // ═══════════════════════════════════════
    case 'sync': {
      const themeName = args.theme
      if (!themeName) {
        output({ error: '--theme is required' })
        process.exit(1)
      }
      const themePath = getThemePath(themeName)
      if (!fs.existsSync(themePath)) {
        output({ error: `Theme '${themeName}' not found at ${themePath}` })
        process.exit(1)
      }

      const apiConfig = requireApiConfig()
      const siteId = args.site || apiConfig.siteId
      const client = new MakeStudioClient(apiConfig.baseUrl, apiConfig.token)

      const applyChanges = args.apply === 'true'
      const deleteRemoteOnly = args.delete === 'true'
      const forceSync = args.force === 'true'
      const batchMode = args.batch === 'true'
      const onlyFilter = args.only ? args.only.split(',').map(s => s.trim()) : null
      const syncStatePath = path.join(themePath, '.sync-state.json')

      // 1. Fetch remote state
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
      const localBlocks = localBlockNames.map(name => readLocalBlock(blocksDir, name))
      const localPartials = localPartialNames.map(name => readLocalPartial(partialsDir, name))

      let localTheme: Record<string, unknown> | null = null
      if (fs.existsSync(themeJsonPath)) {
        localTheme = JSON.parse(fs.readFileSync(themeJsonPath, 'utf-8'))
      }

      // 3. Compute diff
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
          try { syncState = JSON.parse(fs.readFileSync(syncStatePath, 'utf-8')) } catch {}
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
      // This prevents overwriting changes made between diff and apply
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

      // 6. Apply changes — only send properties that actually differ
      console.log('\nApplying changes...')

      // Theme — merge only changed keys into the remote theme
      if (localTheme && freshChangeset.themeChanges.length > 0) {
        console.log(`  Updating theme (${freshChangeset.themeChanges.length} changed keys)...`)
        const mergedTheme = { ...freshSite.theme }
        for (const change of freshChangeset.themeChanges) {
          // Set the changed value at the top-level key
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

      // Partial deletes (opt-in)
      if (deleteRemoteOnly) {
        for (const change of freshChangeset.partials.filter(p => p.type === 'delete')) {
          console.log(`  Deleting partial: ${change.name}`)
          await client.deletePartial(change.remoteId!)
        }
      }

      // Update sync state
      fs.writeFileSync(syncStatePath, JSON.stringify({
        lastSync: new Date().toISOString(),
        tokenId: apiConfig.token.slice(0, 8)
      }, null, 2) + '\n')

      console.log('\nSync complete.')
      process.exit(0)
      break
    }

    // ═══════════════════════════════════════
    // rollback — Restore from snapshot
    // ═══════════════════════════════════════
    case 'rollback': {
      const themeName = args.theme
      if (!themeName) {
        output({ error: '--theme is required' })
        process.exit(1)
      }
      const themePath = getThemePath(themeName)
      if (!fs.existsSync(themePath)) {
        output({ error: `Theme '${themeName}' not found at ${themePath}` })
        process.exit(1)
      }

      const snapshotFile = args.snapshot
      if (!snapshotFile) {
        // List available snapshots
        const snapshots = listSnapshots(themePath)
        if (snapshots.length === 0) {
          output({ error: 'No snapshots found' })
          process.exit(1)
        }
        output({
          message: 'Available snapshots (use --snapshot=<filename>):',
          snapshots
        })
        process.exit(0)
      }

      const apiConfig = requireApiConfig()
      const siteId = args.site || apiConfig.siteId
      const client = new MakeStudioClient(apiConfig.baseUrl, apiConfig.token)

      console.log(`Loading snapshot: ${snapshotFile}`)
      const snapshot = loadSnapshot(themePath, snapshotFile)

      console.log(`Rolling back site ${siteId} to snapshot from ${snapshot.capturedAt}...`)
      const result = await rollbackFromSnapshot(client, siteId, snapshot)

      console.log(`Rollback complete: ${result.blocks} blocks, ${result.partials} partials, theme: ${result.theme}`)
      process.exit(0)
      break
    }

    // ═══════════════════════════════════════
    // pull — Fetch remote state into local files
    // ═══════════════════════════════════════
    case 'pull': {
      const themeName = args.theme
      if (!themeName) {
        output({ error: '--theme is required' })
        process.exit(1)
      }
      const themePath = getThemePath(themeName)
      if (!fs.existsSync(themePath)) {
        fs.mkdirSync(themePath, { recursive: true })
      }

      const apiConfig = requireApiConfig()
      const siteId = args.site || apiConfig.siteId
      const client = new MakeStudioClient(apiConfig.baseUrl, apiConfig.token)
      const onlyPull = args.only ? args.only.split(',').map(s => s.trim()) : null

      console.log(`Pulling remote state for site ${siteId}...`)
      const [remoteSite, remoteBlocks, remotePartialsRes] = await Promise.all([
        client.getSite(siteId),
        client.getBlocks(siteId),
        client.getPartials(siteId)
      ])
      const remotePartials = remotePartialsRes.partials

      const blocksDir = path.join(themePath, 'converted', 'blocks')
      const partialsDir = path.join(themePath, 'converted', 'partials')
      fs.mkdirSync(blocksDir, { recursive: true })
      fs.mkdirSync(partialsDir, { recursive: true })

      let blockCount = 0
      let partialCount = 0
      let themeUpdated = false

      // Pull blocks
      for (const block of remoteBlocks) {
        if (onlyPull && !onlyPull.includes(block.name)) continue

        // Write template
        fs.writeFileSync(
          path.join(blocksDir, `${block.name}.html`),
          block.template || ''
        )

        // Convert API fields back to source format
        const sourceFields = (block.fields || []).map(f => reverseField(f))
        const json: Record<string, unknown> = {
          description: block.description || block.name
        }
        if (sourceFields.length > 0) {
          json.fields = sourceFields
        }
        if (block.thumbnailType) {
          json.thumbnailType = block.thumbnailType
        }
        fs.writeFileSync(
          path.join(blocksDir, `${block.name}.json`),
          JSON.stringify(json, null, 2) + '\n'
        )

        console.log(`  Block: ${block.name}`)
        blockCount++
      }

      // Pull partials
      for (const partial of remotePartials) {
        if (onlyPull && !onlyPull.includes(partial.name)) continue

        fs.writeFileSync(
          path.join(partialsDir, `${partial.name}.html`),
          partial.template || ''
        )
        console.log(`  Partial: ${partial.name}`)
        partialCount++
      }

      // Pull theme
      if (!onlyPull || onlyPull.includes('theme')) {
        const themeJsonPath = path.join(themePath, 'theme.json')
        fs.writeFileSync(themeJsonPath, JSON.stringify(remoteSite.theme, null, 2) + '\n')
        console.log(`  Theme: theme.json`)
        themeUpdated = true
      }

      // Update sync state — pulling acknowledges remote state
      const pullSyncStatePath = path.join(themePath, '.sync-state.json')
      fs.writeFileSync(pullSyncStatePath, JSON.stringify({
        lastSync: new Date().toISOString(),
        tokenId: apiConfig.token.slice(0, 8)
      }, null, 2) + '\n')

      console.log(`\nPulled ${blockCount} blocks, ${partialCount} partials${themeUpdated ? ', theme' : ''}.`)
      process.exit(0)
      break
    }

    case 'validate': {
      const themeName = args.theme
      if (!themeName) {
        output({ error: '--theme is required' })
        process.exit(1)
      }
      const themePath = getThemePath(themeName)
      if (!fs.existsSync(themePath)) {
        output({ error: `Theme '${themeName}' not found at ${themePath}` })
        process.exit(1)
      }
      const result = validate(themePath)
      output(result)
      process.exit(result.valid ? 0 : 1)
      break
    }

    case 'status': {
      const themeName = args.theme
      if (!themeName) {
        output({ error: '--theme is required' })
        process.exit(1)
      }
      const themePath = getThemePath(themeName)
      if (!fs.existsSync(themePath)) {
        output({ error: `Theme '${themeName}' not found at ${themePath}` })
        process.exit(1)
      }

      const manifestPath = path.join(themePath, 'manifest.json')
      const blocksDir = path.join(themePath, 'converted', 'blocks')
      const partialsDir = path.join(themePath, 'converted', 'partials')

      const blockCount = fs.existsSync(blocksDir)
        ? fs.readdirSync(blocksDir).filter(f => f.endsWith('.html')).length
        : 0
      const partialCount = fs.existsSync(partialsDir)
        ? fs.readdirSync(partialsDir).filter(f => f.endsWith('.html')).length
        : 0

      let manifest = null
      if (fs.existsSync(manifestPath)) {
        manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'))
      }

      output({
        theme: themeName,
        path: themePath,
        components: {
          blocks: blockCount,
          partials: partialCount
        },
        manifest
      })
      break
    }


    // ═══════════════════════════════════════
    // setup-pages — Create/update pages and layouts from manifest
    // ═══════════════════════════════════════
    case 'setup-pages': {
      const themeName = args.theme
      if (!themeName) {
        output({ error: '--theme is required' })
        process.exit(1)
      }
      const themePath = getThemePath(themeName)
      const pagesJsonPath = path.join(themePath, 'pages.json')
      if (!fs.existsSync(pagesJsonPath)) {
        output({ error: `pages.json not found at ${pagesJsonPath}` })
        process.exit(1)
      }

      const apiConfig = requireApiConfig()
      const siteId = args.site || apiConfig.siteId
      const client = new MakeStudioClient(apiConfig.baseUrl, apiConfig.token)

      const manifest = JSON.parse(fs.readFileSync(pagesJsonPath, 'utf-8')) as {
        pages?: Array<{ name: string; slug?: string; layout?: string; blocks?: string[] }>
        layouts?: Array<{ name: string; headerBlocks?: string[]; footerBlocks?: string[]; isDefault?: boolean }>
      }

      // Fetch remote state
      console.log(`Fetching remote state for site ${siteId}...`)
      const [remotePages, remoteLayouts, remoteBlocks] = await Promise.all([
        client.getPages(siteId),
        client.getLayouts(siteId),
        client.getBlocks(siteId)
      ])

      const blocksByName = new Map(remoteBlocks.map(b => [b.name, b]))
      const layoutsByName = new Map(remoteLayouts.map(l => [l.name, l]))
      const pagesByName = new Map(remotePages.map(p => [p.name, p]))

      let layoutsCreated = 0, layoutsUpdated = 0
      let pagesCreated = 0, pagesUpdated = 0

      // Reconcile layouts first (pages reference them)
      if (manifest.layouts) {
        for (const layout of manifest.layouts) {
          const existing = layoutsByName.get(layout.name)
          const headerBlocks = (layout.headerBlocks || [])
            .map(name => blocksByName.get(name))
            .filter(Boolean)
            .map(b => ({ id: crypto.randomUUID(), blockId: b!._id, name: b!.name }))
          const footerBlocks = (layout.footerBlocks || [])
            .map(name => blocksByName.get(name))
            .filter(Boolean)
            .map(b => ({ id: crypto.randomUUID(), blockId: b!._id, name: b!.name }))

          if (existing) {
            console.log(`  Updating layout: ${layout.name}`)
            await client.updateLayout(existing._id, {
              headerBlocks,
              footerBlocks,
              isDefault: layout.isDefault
            })
            layoutsByName.set(layout.name, { ...existing, headerBlocks, footerBlocks })
            layoutsUpdated++
          } else {
            console.log(`  Creating layout: ${layout.name}`)
            const created = await client.createLayout({
              name: layout.name,
              site_id: siteId,
              headerBlocks,
              footerBlocks,
              isDefault: layout.isDefault
            })
            layoutsByName.set(layout.name, created)
            layoutsCreated++
          }
        }
      }

      // Reconcile pages
      if (manifest.pages) {
        for (const page of manifest.pages) {
          const existing = pagesByName.get(page.name)
          const layoutId = page.layout ? layoutsByName.get(page.layout)?._id : undefined
          const blocks = (page.blocks || [])
            .map(name => blocksByName.get(name))
            .filter(Boolean)
            .map(b => ({ id: crypto.randomUUID(), blockId: b!._id, name: b!.name }))

          const settings: Record<string, unknown> = {}
          if (page.slug) settings.slug = page.slug
          if (layoutId) settings.layoutId = layoutId

          if (existing) {
            console.log(`  Updating page: ${page.name}`)
            const patch: Record<string, unknown> = { blocks }
            if (Object.keys(settings).length > 0) patch.settings = { ...existing.settings, ...settings }
            await client.updatePage(existing._id, patch)
            pagesUpdated++
          } else {
            console.log(`  Creating page: ${page.name}`)
            const createData: Record<string, unknown> = {
              name: page.name,
              site_id: siteId,
              settings: Object.keys(settings).length > 0 ? settings : undefined
            }
            const created = await client.createPage(createData as any)
            // blocks must be added via update (not supported on create)
            if (blocks.length > 0) {
              await client.updatePage(created._id, { blocks })
            }
            pagesCreated++
          }
        }
      }

      console.log(`\nSetup complete: ${layoutsCreated} layouts created, ${layoutsUpdated} updated; ${pagesCreated} pages created, ${pagesUpdated} updated.`)
      process.exit(0)
      break
    }

    case 'create-site': {
      const siteName = args.name
      if (!siteName) {
        output({ error: '--name is required' })
        process.exit(1)
      }
      const baseUrl = process.env.MAKE_STUDIO_URL
      const createToken = process.env.MAKE_STUDIO_CREATE_TOKEN
      if (!baseUrl || !createToken) {
        output({ error: 'MAKE_STUDIO_URL and MAKE_STUDIO_CREATE_TOKEN environment variables are required' })
        process.exit(1)
      }
      const createClient = new MakeStudioClient(baseUrl, createToken)
      console.log(`Creating site "${siteName}"...`)
      const newSite = await createClient.createSite(siteName)
      const newSiteId = newSite._id
      const siteToken = (newSite as any).apiToken

      if (siteToken) {
        // Update .env with the new site credentials
        const envPath = path.join(ROOT_DIR, '.env')
        let envContent = fs.readFileSync(envPath, 'utf-8')
        envContent = envContent.replace(/^MAKE_STUDIO_TOKEN=.*$/m, `MAKE_STUDIO_TOKEN=${siteToken}`)
        envContent = envContent.replace(/^MAKE_STUDIO_SITE=.*$/m, `MAKE_STUDIO_SITE=${newSiteId}`)
        fs.writeFileSync(envPath, envContent)
        console.log(`Site created: ${newSiteId}`)
        console.log(`Site token saved to .env`)
        console.log(`MAKE_STUDIO_SITE=${newSiteId}`)
      } else {
        console.log(`Site created: ${newSiteId}`)
        console.log('Warning: No API token returned (not using account token?)')
      }
      output({ success: true, siteId: newSiteId, hasToken: !!siteToken })
      process.exit(0)
      break
    }

    default:
      output({ error: `Unknown command: ${command}` })
      process.exit(1)
  }
}

main().catch(err => {
  output({ error: String(err) })
  process.exit(1)
})
