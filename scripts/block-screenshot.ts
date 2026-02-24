/**
 * Block Screenshot Pipeline
 *
 * Syncs a block to Make Studio, deploys preview, captures a Playwright screenshot.
 * Used in the visual iteration loop: write block → screenshot → compare → fix → repeat.
 *
 * Usage:
 *   npx tsx scripts/block-screenshot.ts --theme=block-ingress --block=HeroV2
 *
 * Output:
 *   Screenshot saved to themes/<theme>/iterations/<BlockName>/render-<N>.png
 *   Prints the screenshot path to stdout.
 */

import { readFile, readdir, mkdir } from 'node:fs/promises'
import { join, resolve } from 'node:path'
import { randomUUID } from 'node:crypto'
import { chromium } from 'playwright'
import chalk from 'chalk'
import dotenv from 'dotenv'
import { MakeStudioClient, type ApiBlock } from '../src/api.js'
import { transformField } from '../src/fields.js'
import type { SourceField } from '../src/types.js'

dotenv.config()

// ─── Parse CLI args ───

function parseArgs(): { theme: string; block: string } {
  const args = process.argv.slice(2)
  let theme = ''
  let block = ''
  for (const arg of args) {
    if (arg.startsWith('--theme=')) theme = arg.slice('--theme='.length)
    if (arg.startsWith('--block=')) block = arg.slice('--block='.length)
  }
  if (!theme || !block) {
    console.error('Usage: npx tsx scripts/block-screenshot.ts --theme=<name> --block=<BlockName>')
    process.exit(1)
  }
  return { theme, block }
}

// ─── Read local block files ───

interface LocalBlock {
  name: string
  template: string
  fields: SourceField[]
  description: string
}

async function readLocalBlock(theme: string, blockName: string): Promise<LocalBlock> {
  const blocksDir = join(process.cwd(), 'themes', theme, 'converted', 'blocks')
  const htmlPath = join(blocksDir, `${blockName}.html`)
  const jsonPath = join(blocksDir, `${blockName}.json`)

  const template = await readFile(htmlPath, 'utf-8')
  const jsonRaw = JSON.parse(await readFile(jsonPath, 'utf-8'))

  return {
    name: blockName,
    template,
    fields: jsonRaw.fields || [],
    description: jsonRaw.description || blockName
  }
}

// ─── Read Button partial if it exists ───

async function readButtonPartial(theme: string): Promise<string | null> {
  const path = join(process.cwd(), 'themes', theme, 'converted', 'partials', 'Button.html')
  try {
    return await readFile(path, 'utf-8')
  } catch {
    return null
  }
}

// ─── Sync block to API ───

async function syncBlock(
  client: MakeStudioClient,
  siteId: string,
  local: LocalBlock
): Promise<ApiBlock> {
  const apiFields = local.fields.map(transformField)
  const blocks = await client.getBlocks(siteId)
  const existing = blocks.find(b => b.name === local.name)

  if (existing) {
    console.log(chalk.dim(`  Updating block: ${local.name}`))
    return await client.updateBlock(existing._id, {
      template: local.template,
      fields: apiFields,
      description: local.description
    })
  } else {
    console.log(chalk.dim(`  Creating block: ${local.name}`))
    return await client.createBlock({
      name: local.name,
      site_id: siteId,
      template: local.template,
      fields: apiFields
    })
  }
}

// ─── Sync Button partial ───

async function syncPartial(
  client: MakeStudioClient,
  siteId: string,
  theme: string
): Promise<void> {
  const buttonTemplate = await readButtonPartial(theme)
  if (!buttonTemplate) return

  const { partials } = await client.getPartials(siteId)
  const existing = partials.find(p => p.name === 'Button')

  if (existing) {
    await client.updatePartial(existing._id, { template: buttonTemplate })
  } else {
    await client.createPartial({ name: 'Button', site_id: siteId, template: buttonTemplate })
  }
  console.log(chalk.dim(`  Synced Button partial`))
}

// ─── Sync theme.json ───

async function syncTheme(
  client: MakeStudioClient,
  siteId: string,
  theme: string
): Promise<void> {
  const themePath = join(process.cwd(), 'themes', theme, 'theme.json')
  try {
    const themeData = JSON.parse(await readFile(themePath, 'utf-8'))
    await client.updateSiteTheme(siteId, themeData)
    console.log(chalk.dim(`  Synced theme.json`))
  } catch {
    // No theme.json — skip
  }
}

// ─── Set up scratch page with block ───

async function setupScratchPage(
  client: MakeStudioClient,
  siteId: string,
  apiBlock: ApiBlock
): Promise<{ pageId: string; slug: string }> {
  const pages = await client.getPages(siteId)

  // Use the Index page (always exists, renders at /) for reliable URL resolution
  let target = pages.find(p => p.name === 'Index')

  // Fallback: use first page, or create one
  if (!target) {
    target = pages[0]
  }
  if (!target) {
    console.log(chalk.dim(`  Creating Index page`))
    target = await client.createPage({
      name: 'Index',
      site_id: siteId
    })
  }

  const instanceId = randomUUID()
  const blocks = [{ id: instanceId, blockId: apiBlock._id, name: apiBlock.name }]

  await client.updatePage(target._id, { blocks })

  // Build content from block's default field values
  // setPageContent uses { "BlockName": { "FieldName": value } } — resolves names server-side
  const fieldDefaults: Record<string, unknown> = {}
  for (const field of (apiBlock.fields || [])) {
    fieldDefaults[field.name] = field.value
  }

  if (Object.keys(fieldDefaults).length > 0) {
    await client.setPageContent(target._id, {
      [apiBlock.name]: fieldDefaults
    })
  }

  const slug = target.settings?.slug as string || ''
  console.log(chalk.dim(`  ${target.name} page ready with ${apiBlock.name}`))
  return { pageId: target._id, slug }
}

// ─── Determine next render number ───

async function getNextRenderNumber(iterDir: string): Promise<number> {
  try {
    const files = await readdir(iterDir)
    const renderFiles = files.filter(f => /^render-\d+\.png$/.test(f))
    if (renderFiles.length === 0) return 1
    const numbers = renderFiles.map(f => parseInt(f.match(/render-(\d+)\.png/)![1], 10))
    return Math.max(...numbers) + 1
  } catch {
    return 1
  }
}

// ─── Main ───

async function main() {
  const { theme, block } = parseArgs()
  const baseUrl = process.env.MAKE_STUDIO_URL
  const token = process.env.MAKE_STUDIO_TOKEN
  const siteId = process.env.MAKE_STUDIO_SITE

  if (!baseUrl || !token || !siteId) {
    console.error(chalk.red('Missing MAKE_STUDIO_URL, MAKE_STUDIO_TOKEN, or MAKE_STUDIO_SITE in .env'))
    process.exit(1)
  }

  const client = new MakeStudioClient(baseUrl, token)

  console.log(chalk.bold(`\nBlock Screenshot: ${block}`))

  // 1. Read local block files
  console.log(chalk.cyan('\n[1/5] Reading local block files'))
  const local = await readLocalBlock(theme, block)
  console.log(chalk.dim(`  Template: ${local.template.length} chars, ${local.fields.length} fields`))

  // 2. Sync block + theme + partial
  console.log(chalk.cyan('\n[2/5] Syncing to Make Studio'))
  await syncTheme(client, siteId, theme)
  await syncPartial(client, siteId, theme)
  const apiBlock = await syncBlock(client, siteId, local)

  // 3. Set up page with block
  console.log(chalk.cyan('\n[3/5] Setting up page'))
  const { slug } = await setupScratchPage(client, siteId, apiBlock)

  // 4. Deploy preview
  console.log(chalk.cyan('\n[4/5] Deploying preview'))
  const deployResult = await client.deployPreview(siteId)
  const previewUrl = deployResult.previewUrl
  console.log(chalk.dim(`  Preview: ${previewUrl}`))

  // 5. Screenshot with Playwright
  console.log(chalk.cyan('\n[5/5] Taking screenshot'))
  const pageUrl = slug ? `${previewUrl}/${slug}` : previewUrl
  console.log(chalk.dim(`  Navigating to ${pageUrl}`))

  const browser = await chromium.launch()
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } })
  const page = await context.newPage()

  await page.goto(pageUrl, { waitUntil: 'networkidle' })

  // Ensure iterations directory exists
  const iterDir = join(process.cwd(), 'themes', theme, 'iterations', block)
  await mkdir(iterDir, { recursive: true })

  const renderNum = await getNextRenderNumber(iterDir)
  const screenshotPath = join(iterDir, `render-${renderNum}.png`)

  await page.screenshot({ path: screenshotPath, fullPage: true })
  await browser.close()

  console.log(chalk.green(`\n✓ Screenshot saved: ${screenshotPath}`))

  // Print path to stdout for script consumers
  console.log(screenshotPath)
}

main().catch(err => {
  console.error(chalk.red(err.message || err))
  process.exit(1)
})
