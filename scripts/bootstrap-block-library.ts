/**
 * Bootstrap Block Library
 *
 * One-time script: pulls blocks from the block-ingress site API and generates
 * an initial data/blocks.json manifest with metadata stubs.
 *
 * Usage:
 *   npx tsx scripts/bootstrap-block-library.ts [--site=<siteId>] [--merge]
 *
 * Options:
 *   --site    Site ID to pull from (default: block-ingress site from .env)
 *   --merge   Merge with existing data/blocks.json instead of overwriting
 */

import 'dotenv/config'
import { readFileSync, writeFileSync, existsSync } from 'fs'
import { resolve } from 'path'
import { MakeStudioClient } from '../src/api.js'

interface BlockEntry {
  name: string
  blockCategory: string | null
  description: string
  aiDescription: string
  tags: string[]
}

async function main() {
  const args = process.argv.slice(2)
  const siteArg = args.find(a => a.startsWith('--site='))
  const merge = args.includes('--merge')

  const siteId = siteArg?.split('=')[1] || process.env.MAKE_STUDIO_SITE
  const baseUrl = process.env.MAKE_STUDIO_URL || 'https://api.makestudio.cc'
  const token = process.env.MAKE_STUDIO_TOKEN

  if (!siteId || !token) {
    console.error('Missing MAKE_STUDIO_SITE or MAKE_STUDIO_TOKEN in .env')
    process.exit(1)
  }

  const client = new MakeStudioClient(baseUrl, token)
  const blocks = await client.getBlocks(siteId)

  console.log(`Fetched ${blocks.length} blocks from site ${siteId}`)

  const outputPath = resolve('data/blocks.json')

  // Load existing entries for merge
  let existing: BlockEntry[] = []
  if (merge && existsSync(outputPath)) {
    existing = JSON.parse(readFileSync(outputPath, 'utf-8'))
    console.log(`Loaded ${existing.length} existing entries for merge`)
  }
  const existingByName = new Map(existing.map(e => [e.name, e]))

  const entries: BlockEntry[] = blocks
    .filter(b => b.name && b.template) // skip empty blocks
    .map(b => {
      // If merging, keep existing curated metadata
      const ex = existingByName.get(b.name)
      if (ex) return ex

      return {
        name: b.name,
        blockCategory: b.blockCategory || null,
        description: b.description || '',
        aiDescription: b.aiDescription || '',
        tags: b.tags || []
      }
    })
    .sort((a, b) => a.name.localeCompare(b.name))

  writeFileSync(outputPath, JSON.stringify(entries, null, 2) + '\n')
  console.log(`Wrote ${entries.length} block entries to ${outputPath}`)

  // Report blocks missing metadata
  const incomplete = entries.filter(e => !e.aiDescription || !e.blockCategory || e.tags.length === 0)
  if (incomplete.length > 0) {
    console.log(`\n${incomplete.length} blocks need metadata curation:`)
    for (const e of incomplete) {
      const missing: string[] = []
      if (!e.blockCategory) missing.push('blockCategory')
      if (!e.aiDescription) missing.push('aiDescription')
      if (e.tags.length === 0) missing.push('tags')
      console.log(`  - ${e.name}: missing ${missing.join(', ')}`)
    }
  }
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})
