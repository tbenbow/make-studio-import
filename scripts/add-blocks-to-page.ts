#!/usr/bin/env npx tsx
/**
 * Add all blocks to the index page for preview.
 * Usage: npx tsx scripts/add-blocks-to-page.ts
 */

import 'dotenv/config'
import { MakeStudioClient } from '../src/api.js'

const client = new MakeStudioClient(
  process.env.MAKE_STUDIO_URL!,
  process.env.MAKE_STUDIO_TOKEN!
)
const siteId = process.env.MAKE_STUDIO_SITE!

async function main() {
  // Get all blocks, optionally filter by prefix from CLI arg
  const filterPrefix = process.argv[2]
  let blocks = await client.getBlocks(siteId)
  if (filterPrefix) {
    blocks = blocks.filter(b => b.name.startsWith(filterPrefix))
    console.log(`Filtered to ${blocks.length} blocks matching "${filterPrefix}"`)
  } else {
    console.log(`Found ${blocks.length} blocks`)
  }

  // Get pages
  const pages = await client.getPages(siteId)
  console.log(`Found ${pages.length} pages`)

  // Find or create index page
  let indexPage = pages.find(p => p.name === 'Index' || p.name === 'Home')
  if (!indexPage) {
    console.log('Creating Index page...')
    indexPage = await client.createPage({ name: 'Index', site_id: siteId })
  }
  console.log(`Using page: ${indexPage.name} (${indexPage._id})`)

  // Build block instances — one per block, with default content
  const blockInstances = blocks.map(block => ({
    id: crypto.randomUUID(),
    blockId: block._id,
    name: block.name,
    content: {}  // uses field defaults
  }))

  // Update the page with all blocks
  await client.updatePage(indexPage._id, { blocks: blockInstances })
  console.log(`Added ${blockInstances.length} blocks to ${indexPage.name}`)

  // Deploy preview
  console.log('Deploying preview...')
  const result = await client.deployPreview(siteId)
  console.log(`Preview: ${result.previewUrl}`)
}

main().catch(console.error)
