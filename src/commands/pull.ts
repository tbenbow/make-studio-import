import fs from 'fs'
import path from 'path'
import {
  type CommandContext,
  getThemePath, output, requireApiConfig,
  MakeStudioClient, reverseField
} from './context.js'

export async function pullCommand(ctx: CommandContext): Promise<void> {
  const { args, rootDir } = ctx

  const themeName = args.theme
  if (!themeName) {
    output({ error: '--theme is required' })
    process.exit(1)
  }
  const themePath = getThemePath(rootDir, themeName)
  if (!fs.existsSync(themePath)) {
    fs.mkdirSync(themePath, { recursive: true })
  }

  const apiConfig = requireApiConfig(rootDir, args.env)
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

    fs.writeFileSync(
      path.join(blocksDir, `${block.name}.html`),
      block.template || ''
    )

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

  // Update sync state
  const pullSyncStatePath = path.join(themePath, '.sync-state.json')
  fs.writeFileSync(pullSyncStatePath, JSON.stringify({
    lastSync: new Date().toISOString(),
    tokenId: apiConfig.token.slice(0, 8)
  }, null, 2) + '\n')

  console.log(`\nPulled ${blockCount} blocks, ${partialCount} partials${themeUpdated ? ', theme' : ''}.`)
  process.exit(0)
}
