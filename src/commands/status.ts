import fs from 'fs'
import path from 'path'
import { type CommandContext, getThemePath, output } from './context.js'

export async function statusCommand(ctx: CommandContext): Promise<void> {
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
}
