#!/usr/bin/env node
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { randomUUID } from 'crypto'
import readline from 'readline'
import dotenv from 'dotenv'
import { validate } from './validate.js'
import { importTheme } from './import.js'
import { exportSite } from './export.js'
import { copyTheme } from './copy-theme.js'
import { updateBlock } from './update-block.js'
import { generateCatalog, writeCatalog } from './catalog.js'
import { validatePage } from './validate-page.js'
import { importPage } from './import-page.js'
import { cloneSite } from './clone-site.js'
import { pushSite } from './push-site.js'
import { scrapeSite } from './scrape-site.js'
import { MakeStudioClient } from './api.js'
import { computeChangeset, type LocalBlock, type LocalPartial } from './diff.js'
import { saveSnapshot, listSnapshots, loadSnapshot, rollbackFromSnapshot } from './snapshot.js'
import type { SourceField } from './types.js'

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

function getSitePath(siteName: string): string {
  return path.join(ROOT_DIR, 'sites', siteName)
}

function getThemesDir(): string {
  return path.join(ROOT_DIR, 'themes')
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

function requireMongoUri(): string {
  const mongoUri = process.env.MONGODB_URI
  if (!mongoUri) {
    output({ error: 'MONGODB_URI environment variable is required' })
    process.exit(1)
  }
  return mongoUri
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

// ─── Field type mapping (shared with import.ts) ───

const TYPE_MAP: Record<string, string> = {
  text: 'text',
  textarea: 'textarea',
  wysiwyg: 'wysiwyg',
  richText: 'wysiwyg',
  image: 'image',
  items: 'items',
  repeater: 'items',
  select: 'select',
  toggle: 'select',
  group: 'group',
  number: 'number',
  date: 'date'
}

function getDefaultValue(field: SourceField, dbType: string): unknown {
  if (field.default !== undefined) {
    if (dbType === 'items' && Array.isArray(field.default)) {
      return (field.default as Record<string, unknown>[]).map((item) => {
        const transformedItem: Record<string, unknown> = { id: randomUUID() }
        for (const [key, value] of Object.entries(item)) {
          transformedItem[key] = value
        }
        return transformedItem
      })
    }
    return field.default
  }
  switch (dbType) {
    case 'items': return []
    case 'number': return 0
    default: return ''
  }
}

function transformField(field: SourceField): unknown {
  const dbType = TYPE_MAP[field.type] || 'text'
  const transformed: Record<string, unknown> = {
    id: randomUUID(),
    type: dbType,
    name: field.name,
    value: getDefaultValue(field, dbType),
    config: {}
  }
  if (field.config) {
    transformed.config = { ...field.config }
    if (field.config.fields) {
      (transformed.config as Record<string, unknown>).fields = field.config.fields.map(transformField)
    }
  }
  return transformed
}

// ─── Reverse field mapping (API → source format for pull) ───

function reverseField(field: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {
    type: field.type as string,
    name: field.name as string
  }

  const value = field.value
  if (field.type === 'items' && Array.isArray(value)) {
    // Convert items value — strip volatile ids from items
    result.default = (value as Record<string, unknown>[]).map(item => {
      const { id, _id, ...rest } = item
      return rest
    })
    // Convert config.fields back to source format, preserve other config keys
    const config = field.config as Record<string, unknown> | undefined
    if (config?.fields && Array.isArray(config.fields)) {
      const { fields: configFields, ...otherConfig } = config
      result.config = {
        ...otherConfig,
        fields: (configFields as Record<string, unknown>[]).map(f => reverseField(f))
      }
    }
  } else {
    if (value !== undefined && value !== '') {
      result.default = value
    }
    // Preserve non-empty config (selectOptions, image settings, etc.)
    const config = field.config as Record<string, unknown> | undefined
    if (config && Object.keys(config).length > 0) {
      result.config = config
    }
  }

  return result
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
        'import-db': 'Import to Make Studio database (legacy, direct MongoDB)',
        export: 'Export from Make Studio database',
        'copy-theme': 'Copy theme between sites',
        'update-block': 'Update a single block template',
        status: 'Show theme status',
        'generate-catalog': 'Generate block catalog from theme',
        'validate-page': 'Validate page JSON against catalog',
        'import-page': 'Import page JSON to Make Studio',
        'clone-site': 'Clone a site with all blocks, partials, and pages',
        'push-site': 'Push a site from one database to another',
        'create-site': 'Create a new Make Studio site and save credentials to .env',
        'scrape-site': 'Scrape a live website and generate make-studio theme files',
        rollback: 'Rollback to a previous snapshot'
      },
      options: {
        '--theme': 'Theme name (required for sync/pull/validate/import-db/export/status)',
        '--site': 'Site ID (overrides MAKE_STUDIO_SITE env var)',
        '--apply': 'Apply changes (sync only — default is dry run)',
        '--delete': 'Delete remote-only blocks/partials (with --apply)',
        '--only': 'Comma-separated list of block/partial names to sync or pull (use "theme" for theme)',
        '--page': 'Page name (required for validate-page/import-page)',
        '--replace': 'Replace existing blocks/partials on import-db',
        '--from': 'Source site ID (for copy-theme/clone-site)',
        '--to': 'Target site ID (for copy-theme)',
        '--name': 'New site name (for clone-site)',
        '--url': 'URL to scrape (for scrape-site)',
        '--target-uri': 'Target MongoDB URI (for push-site)',
        '--owner': 'Clerk user ID for new site owner (for push-site)',
        '--id': 'Block ID (for update-block)',
        '--template': 'Template file path (for update-block)',
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
      const onlyFilter = args.only ? args.only.split(',').map(s => s.trim()) : null

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

      // 5. Confirm before applying
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

    case 'import':
    case 'import-db': {
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

      const siteId = args.site
      if (!siteId) {
        output({ error: '--site is required for import-db' })
        process.exit(1)
      }

      const mongoUri = requireMongoUri()

      // Validate first
      const validation = validate(themePath)
      if (!validation.valid) {
        output({ error: 'Validation failed', validation })
        process.exit(1)
      }

      if (command === 'import') {
        console.log('Note: "import" is now "import-db". Use "sync" for API-based sync.')
      }

      const replace = args.replace === 'true'
      const result = await importTheme(themePath, siteId, mongoUri, { replace })
      output(result)
      process.exit(result.success ? 0 : 1)
      break
    }

    case 'export': {
      const themeName = args.theme
      if (!themeName) {
        output({ error: '--theme is required' })
        process.exit(1)
      }
      const themePath = getThemePath(themeName)
      if (!fs.existsSync(themePath)) {
        // Create theme directory if it doesn't exist
        fs.mkdirSync(themePath, { recursive: true })
      }

      const siteId = args.site
      if (!siteId) {
        output({ error: '--site is required for export' })
        process.exit(1)
      }

      const mongoUri = requireMongoUri()
      const result = await exportSite(siteId, themePath, mongoUri)
      output(result)
      process.exit(result.success ? 0 : 1)
      break
    }

    case 'copy-theme': {
      const fromId = args.from
      const toId = args.to
      if (!fromId || !toId) {
        output({ error: '--from and --to are required for copy-theme' })
        process.exit(1)
      }

      const mongoUri = requireMongoUri()
      const result = await copyTheme(fromId, toId, mongoUri)
      output(result)
      process.exit(result.success ? 0 : 1)
      break
    }

    case 'update-block': {
      const blockId = args.id
      const templatePath = args.template
      if (!blockId || !templatePath) {
        output({ error: '--id and --template are required for update-block' })
        process.exit(1)
      }

      const resolvedPath = path.resolve(templatePath)
      if (!fs.existsSync(resolvedPath)) {
        output({ error: `Template file not found: ${resolvedPath}` })
        process.exit(1)
      }

      const mongoUri = requireMongoUri()
      const result = await updateBlock(blockId, resolvedPath, mongoUri)
      output(result)
      process.exit(result.success ? 0 : 1)
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

    case 'generate-catalog': {
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

      const catalog = generateCatalog(themePath)
      writeCatalog(themePath, catalog)
      output({
        success: true,
        theme: themeName,
        blocks: catalog.blocks.length,
        outputPath: path.join(themePath, 'catalog.json')
      })
      break
    }

    case 'validate-page': {
      const siteName = args.site
      const pageName = args.page
      if (!siteName || !pageName) {
        output({ error: '--site and --page are required' })
        process.exit(1)
      }

      const sitePath = getSitePath(siteName)
      if (!fs.existsSync(sitePath)) {
        output({ error: `Site '${siteName}' not found at ${sitePath}` })
        process.exit(1)
      }

      const result = validatePage(sitePath, pageName, getThemesDir())
      output(result)
      process.exit(result.valid ? 0 : 1)
      break
    }

    case 'import-page': {
      const siteName = args.site
      const pageName = args.page
      if (!siteName || !pageName) {
        output({ error: '--site and --page are required' })
        process.exit(1)
      }

      const sitePath = getSitePath(siteName)
      if (!fs.existsSync(sitePath)) {
        output({ error: `Site '${siteName}' not found at ${sitePath}` })
        process.exit(1)
      }

      const mongoUri = requireMongoUri()
      const result = await importPage(sitePath, pageName, mongoUri)
      output(result)
      process.exit(result.success ? 0 : 1)
      break
    }

    case 'clone-site': {
      const fromId = args.from
      const newName = args.name
      if (!fromId) {
        output({ error: '--from is required (source site ID)' })
        process.exit(1)
      }
      if (!newName) {
        output({ error: '--name is required (name for new site)' })
        process.exit(1)
      }

      const mongoUri = requireMongoUri()
      const result = await cloneSite(fromId, newName, mongoUri)
      output(result)
      process.exit(result.success ? 0 : 1)
      break
    }

    case 'push-site': {
      const fromId = args.from
      if (!fromId) {
        output({ error: '--from is required (source site ID)' })
        process.exit(1)
      }

      const targetUri = args['target-uri'] || process.env.TARGET_MONGODB_URI
      if (!targetUri) {
        output({ error: '--target-uri or TARGET_MONGODB_URI env var is required' })
        process.exit(1)
      }

      const sourceUri = requireMongoUri()
      const result = await pushSite(fromId, sourceUri, targetUri, {
        owner: args.owner,
      })
      output(result)
      process.exit(result.success ? 0 : 1)
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

    case 'scrape-site': {
      const siteUrl = args.url
      const themeName = args.theme
      if (!siteUrl || !themeName) {
        output({ error: '--url and --theme are required' })
        process.exit(1)
      }
      const outputDir = getThemePath(themeName)
      const result = await scrapeSite({ url: siteUrl, themeName, outputDir })
      output(result)
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
