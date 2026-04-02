/**
 * Generate a Make Studio block from a screenshot image using the app's AI endpoint.
 *
 * Uploads the image to R2 first (the API needs a URL, not a file), then calls
 * POST /blocks/generate-template which returns { template, fields }.
 *
 * Writes the result to the theme's converted/blocks/ directory.
 *
 * Usage:
 *   npx tsx scripts/generate-block-from-image.ts --theme=<name> --image=<path> --name=<BlockName> [--prompt="extra instructions"]
 *
 * Requires MAKE_STUDIO_URL, MAKE_STUDIO_TOKEN, MAKE_STUDIO_SITE in .env
 */

import dotenv from 'dotenv'
import path from 'path'
import fs from 'fs'
dotenv.config({ path: path.resolve(import.meta.dirname, '..', '.env') })

import { MakeStudioClient } from '../src/api.js'
import { parseArgs } from '../src/utils/args.js'

const args = parseArgs(process.argv.slice(2))
const themeName = args.theme as string
const imagePath = args.image as string
const blockName = args.name as string
const prompt = args.prompt as string || ''

if (!themeName || !imagePath || !blockName) {
  console.log('Usage: npx tsx scripts/generate-block-from-image.ts --theme=<name> --image=<path> --name=<BlockName> [--prompt="..."]')
  process.exit(1)
}

const rootDir = path.resolve(import.meta.dirname, '..')
const blocksDir = path.join(rootDir, 'themes', themeName, 'converted', 'blocks')

async function main() {
  const client = new MakeStudioClient(process.env.MAKE_STUDIO_URL!, process.env.MAKE_STUDIO_TOKEN!)
  const siteId = process.env.MAKE_STUDIO_SITE!

  // Step 1: Upload the screenshot to R2 so the API can fetch it
  const imageBuffer = fs.readFileSync(imagePath)
  const ext = path.extname(imagePath).slice(1) || 'png'
  const mimeType = ext === 'jpg' ? 'image/jpeg' : `image/${ext}`
  const uploadName = `section-${blockName.toLowerCase()}.${ext}`

  console.log(`Uploading ${uploadName}...`)
  const uploaded = await client.uploadFile(siteId, imageBuffer, uploadName, mimeType)
  const imageUrl = uploaded.url
  console.log(`  → ${imageUrl}`)

  // Step 2: Call generate-template
  const appUrl = process.env.MAKE_STUDIO_URL!
  const appToken = process.env.MAKE_STUDIO_TOKEN!

  console.log(`Generating block "${blockName}" from image...`)
  const res = await fetch(`${appUrl.replace(/\/$/, '')}/blocks/generate-template`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${appToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name: blockName,
      site_id: siteId,
      imageData: imageUrl,
      prompt: prompt || undefined,
    }),
  })

  if (!res.ok) {
    const err = await res.text()
    console.error(`API error ${res.status}: ${err}`)
    process.exit(1)
  }

  const result = await res.json() as { template: string; fields: unknown[] }
  console.log(`  ✓ Generated template (${result.template.length} chars) + ${result.fields.length} fields`)

  // Step 3: Write to theme directory
  await fs.promises.mkdir(blocksDir, { recursive: true })

  const htmlPath = path.join(blocksDir, `${blockName}.html`)
  const jsonPath = path.join(blocksDir, `${blockName}.json`)

  fs.writeFileSync(htmlPath, result.template)
  fs.writeFileSync(jsonPath, JSON.stringify({
    description: blockName.slice(0, 30),
    fields: result.fields,
  }, null, 2))

  console.log(`  Wrote ${htmlPath}`)
  console.log(`  Wrote ${jsonPath}`)
  console.log('Done!')
}

main().catch(console.error)
