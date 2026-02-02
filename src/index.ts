#!/usr/bin/env node
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import dotenv from 'dotenv'
import { validate } from './validate.js'
import { importTheme } from './import.js'

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

function output(data: unknown) {
  console.log(JSON.stringify(data, null, 2))
}

async function main() {
  const [command, ...rest] = process.argv.slice(2)
  const args = parseArgs(rest)

  if (!command || command === 'help' || command === '--help') {
    output({
      commands: {
        validate: 'Validate converted files',
        import: 'Import to Make Studio database',
        status: 'Show theme status'
      },
      options: {
        '--theme': 'Theme name (required)',
        '--site': 'Site ID (required for import)'
      },
      examples: [
        'npm run validate -- --theme=oatmeal',
        'npm run import -- --theme=oatmeal --site=abc123',
        'npm run status -- --theme=oatmeal'
      ]
    })
    return
  }

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

  switch (command) {
    case 'validate': {
      const result = validate(themePath)
      output(result)
      process.exit(result.valid ? 0 : 1)
      break
    }

    case 'import': {
      const siteId = args.site
      if (!siteId) {
        output({ error: '--site is required for import' })
        process.exit(1)
      }

      const mongoUri = process.env.MONGODB_URI
      if (!mongoUri) {
        output({ error: 'MONGODB_URI environment variable is required' })
        process.exit(1)
      }

      // Validate first
      const validation = validate(themePath)
      if (!validation.valid) {
        output({
          error: 'Validation failed',
          validation
        })
        process.exit(1)
      }

      const result = await importTheme(themePath, siteId, mongoUri)
      output(result)
      process.exit(result.success ? 0 : 1)
      break
    }

    case 'status': {
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

    default:
      output({ error: `Unknown command: ${command}` })
      process.exit(1)
  }
}

main().catch(err => {
  output({ error: String(err) })
  process.exit(1)
})
