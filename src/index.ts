#!/usr/bin/env node
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
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

async function main() {
  const [command, ...rest] = process.argv.slice(2)
  const args = parseArgs(rest)

  if (!command || command === 'help' || command === '--help') {
    output({
      commands: {
        validate: 'Validate converted files',
        import: 'Import to Make Studio database',
        export: 'Export from Make Studio database',
        'copy-theme': 'Copy theme between sites',
        'update-block': 'Update a single block template',
        status: 'Show theme status',
        'generate-catalog': 'Generate block catalog from theme',
        'validate-page': 'Validate page JSON against catalog',
        'import-page': 'Import page JSON to Make Studio',
        'clone-site': 'Clone a site with all blocks, partials, and pages',
        'push-site': 'Push a site from one database to another'
      },
      options: {
        '--theme': 'Theme name (required for validate/import/export/status/generate-catalog)',
        '--site': 'Site ID or name (required for import/export/validate-page/import-page)',
        '--page': 'Page name (required for validate-page/import-page)',
        '--replace': 'Replace existing blocks/partials on import',
        '--from': 'Source site ID (for copy-theme/clone-site)',
        '--to': 'Target site ID (for copy-theme)',
        '--name': 'New site name (for clone-site)',
        '--target-uri': 'Target MongoDB URI (for push-site)',
        '--owner': 'Clerk user ID for new site owner (for push-site)',
        '--id': 'Block ID (for update-block)',
        '--template': 'Template file path (for update-block)'
      }
    })
    return
  }

  switch (command) {
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

    case 'import': {
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
        output({ error: '--site is required for import' })
        process.exit(1)
      }

      const mongoUri = requireMongoUri()

      // Validate first
      const validation = validate(themePath)
      if (!validation.valid) {
        output({ error: 'Validation failed', validation })
        process.exit(1)
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

    default:
      output({ error: `Unknown command: ${command}` })
      process.exit(1)
  }
}

main().catch(err => {
  output({ error: String(err) })
  process.exit(1)
})
