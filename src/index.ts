#!/usr/bin/env node
import path from 'path'
import { fileURLToPath } from 'url'
import dotenv from 'dotenv'
import { parseArgs } from './utils/args.js'
import { createLogger } from './logger.js'
import { output, type CommandContext } from './commands/context.js'
import { syncCommand } from './commands/sync.js'
import { pullCommand } from './commands/pull.js'
import { rollbackCommand } from './commands/rollback.js'
import { validateCommand } from './commands/validate-cmd.js'
import { statusCommand } from './commands/status.js'
import { setupPagesCommand } from './commands/setup-pages.js'
import { createSiteCommand } from './commands/create-site.js'
import { mediaCommand } from './commands/media.js'
import { loadPlugins, getPluginCommands } from './plugins.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT_DIR = path.resolve(__dirname, '..')

// Load env from project root
dotenv.config({ path: path.join(ROOT_DIR, '.env') })

const COMMANDS: Record<string, (ctx: CommandContext) => Promise<void>> = {
  sync: syncCommand,
  pull: pullCommand,
  rollback: rollbackCommand,
  validate: validateCommand,
  status: statusCommand,
  'setup-pages': setupPagesCommand,
  'create-site': createSiteCommand,
  media: mediaCommand
}

async function main() {
  const [command, ...rest] = process.argv.slice(2)
  // Check if second arg is a subcommand (not a flag)
  const subcommand = rest[0] && !rest[0].startsWith('--') ? rest[0] : undefined
  const flagArgs = subcommand ? rest.slice(1) : rest
  const args = parseArgs(flagArgs)
  if (subcommand) args._sub = subcommand
  const logger = createLogger({ verbose: args.verbose === 'true' })

  if (!command || command === 'help' || command === '--help') {
    output({
      commands: {
        sync: 'Sync theme to Make Studio via API (dry run by default)',
        pull: 'Pull remote state into local theme files',
        validate: 'Validate converted files',
        status: 'Show theme status',
        'setup-pages': 'Create/update pages and layouts from pages.json manifest',
        'create-site': 'Create a new Make Studio site and save credentials to .env',
        rollback: 'Rollback to a previous snapshot',
        'media list': 'List media files for the site',
        'media upload': 'Upload a file (--file=<path>)',
        'media unused': 'Find unreferenced media files (--theme=<name>)'
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
        '--snapshot': 'Snapshot filename (for rollback)',
        '--env': 'Environment name from .make-studio.json (e.g. production, local)',
        '--verbose': 'Show detailed debug output'
      }
    })
    return
  }

  // Load plugins
  const plugins = await loadPlugins(ROOT_DIR)
  const pluginCommands = getPluginCommands(plugins)
  const allCommands = { ...COMMANDS, ...pluginCommands }

  const handler = allCommands[command]
  if (!handler) {
    output({ error: `Unknown command: ${command}` })
    process.exit(1)
  }

  await handler({ args, rootDir: ROOT_DIR, logger })
}

main().catch(err => {
  output({ error: String(err) })
  process.exit(1)
})
