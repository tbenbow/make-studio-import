import fs from 'fs'
import { validate } from '../validate.js'
import { type CommandContext, getThemePath, output } from './context.js'

export async function validateCommand(ctx: CommandContext): Promise<void> {
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
  const result = validate(themePath)
  output(result)
  process.exit(result.valid ? 0 : 1)
}
