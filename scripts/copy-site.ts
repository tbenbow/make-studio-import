#!/usr/bin/env npx tsx
/**
 * Copy Site Between Environments
 *
 * Copies a complete site (blocks, partials, theme, layouts, pages, post types,
 * folders, data stores) from one Make Studio environment to another using the
 * snapshot export/import system.
 *
 * Usage:
 *   npx tsx scripts/copy-site.ts \
 *     --source-url=https://api.makestudio.io --source-token=xxx --source-site=abc123 \
 *     --target-url=http://localhost:3001 --target-token=yyy \
 *     [--target-site=def456] [--name="My Site Copy"] [--files]
 *
 * Options:
 *   --source-url     Source API base URL (required)
 *   --source-token   Source API token (required)
 *   --source-site    Source site ID (required)
 *   --target-url     Target API base URL (required)
 *   --target-token   Target API token (required)
 *   --target-site    Target site ID (omit to create a new site)
 *   --name           Name for the new site (required if --target-site is omitted)
 *   --files          Copy media files and rewrite CDN URLs (default: skip)
 *
 * How it works:
 *   1. Creates a snapshot on the source site (serializes everything)
 *   2. Exports the snapshot data blob
 *   3. Optionally copies media files via upload-from-urls
 *   4. Imports the snapshot data on the target site (restores everything)
 *   5. Rewrites CDN URLs in the restored content if files were copied
 */
import { MakeStudioClient } from '../src/api.js'

// ─── Argument parsing ───

function parseArgs(args: string[]): Record<string, string> {
  const result: Record<string, string> = {}
  for (const arg of args) {
    if (arg.startsWith('--')) {
      const eq = arg.indexOf('=')
      if (eq > -1) {
        result[arg.slice(2, eq)] = arg.slice(eq + 1)
      } else {
        result[arg.slice(2)] = 'true'
      }
    }
  }
  return result
}

const args = parseArgs(process.argv.slice(2))

const sourceUrl = args['source-url']
const sourceToken = args['source-token']
const sourceSiteId = args['source-site']
const targetUrl = args['target-url']
const targetToken = args['target-token']
let targetSiteId = args['target-site']
const siteName = args['name']
const includeFiles = args['files'] === 'true'

if (!sourceUrl || !sourceToken || !sourceSiteId) {
  console.error('Required: --source-url, --source-token, --source-site')
  process.exit(1)
}
if (!targetUrl || !targetToken) {
  console.error('Required: --target-url, --target-token')
  process.exit(1)
}
if (!targetSiteId && !siteName) {
  console.error('Required: --target-site or --name (to create a new site)')
  process.exit(1)
}

// ─── URL rewriting ───

type UrlMap = Map<string, string>
const CDN_DOMAIN = 'makestudio.site'

/**
 * Recursively walk a data structure, replacing any string values that match
 * URLs in the urlMap.
 */
function rewriteUrls(data: unknown, urlMap: UrlMap): unknown {
  if (typeof data === 'string') {
    let result = data
    for (const [oldUrl, newUrl] of urlMap) {
      if (result.includes(oldUrl)) {
        result = result.replaceAll(oldUrl, newUrl)
      }
    }
    return result
  }
  if (Array.isArray(data)) {
    return data.map(item => rewriteUrls(item, urlMap))
  }
  if (data && typeof data === 'object') {
    const result: Record<string, unknown> = {}
    for (const [key, value] of Object.entries(data)) {
      result[key] = rewriteUrls(value, urlMap)
    }
    return result
  }
  return data
}

/**
 * Find all CDN URLs referencing the source site in a data structure.
 */
function findFileUrls(data: unknown, siteId: string, found: Set<string>): void {
  if (typeof data === 'string') {
    const regex = new RegExp(`https://${CDN_DOMAIN}/${siteId}/[^"'\\s<>)]+`, 'g')
    const matches = data.match(regex)
    if (matches) {
      for (const m of matches) found.add(m)
    }
    return
  }
  if (Array.isArray(data)) {
    for (const item of data) findFileUrls(item, siteId, found)
    return
  }
  if (data && typeof data === 'object') {
    for (const value of Object.values(data)) {
      findFileUrls(value, siteId, found)
    }
  }
}

// ─── File copying ───

/**
 * Copy ALL media files from source to target via upload-from-urls.
 * Lists the source media library, uploads everything, returns a URL map for rewriting.
 */
async function copyFiles(
  source: MakeStudioClient,
  target: MakeStudioClient,
  sourceSiteId: string,
  targetSiteId: string,
): Promise<UrlMap> {
  const urlMap: UrlMap = new Map()

  // List all files in the source media library
  const sourceFiles = await source.listFiles(sourceSiteId)

  if (sourceFiles.length === 0) {
    console.log('  No files in source media library.')
    return urlMap
  }

  console.log(`  Found ${sourceFiles.length} file(s) in source media library.`)

  // Batch upload via server-side URL fetch (max 20 per request)
  const BATCH_SIZE = 20
  let copied = 0
  let failed = 0

  for (let i = 0; i < sourceFiles.length; i += BATCH_SIZE) {
    const batch = sourceFiles.slice(i, i + BATCH_SIZE)
    const batchNum = Math.floor(i / BATCH_SIZE) + 1
    const totalBatches = Math.ceil(sourceFiles.length / BATCH_SIZE)
    if (totalBatches > 1) {
      console.log(`  Batch ${batchNum}/${totalBatches} (${batch.length} files)...`)
    }

    const images = batch.map(f => ({
      url: f.fullPath,
      fileName: f.name,
    }))

    try {
      const results = await target.uploadFilesFromUrls(targetSiteId, images)

      for (let j = 0; j < results.length; j++) {
        const result = results[j]
        const sourceFile = batch[j]
        const filename = sourceFile.name

        if (result.success && result.fullPath) {
          urlMap.set(sourceFile.fullPath, result.fullPath)
          console.log(`  OK ${filename}`)
          copied++
        } else if (result.error?.includes('already exists')) {
          const targetFileUrl = `https://${CDN_DOMAIN}/${targetSiteId}/${filename}`
          urlMap.set(sourceFile.fullPath, targetFileUrl)
          console.log(`  OK ${filename} (already exists)`)
          copied++
        } else {
          console.log(`  FAIL ${filename}: ${result.error || 'unknown error'}`)
          failed++
        }
      }
    } catch (err: any) {
      console.log(`  Batch ${batchNum} failed: ${err.message}`)
      failed += batch.length
    }
  }

  console.log(`  Files: ${copied} copied, ${failed} failed`)
  return urlMap
}

// ─── Main ───

async function main() {
  const source = new MakeStudioClient(sourceUrl, sourceToken)
  const target = new MakeStudioClient(targetUrl, targetToken)

  // 1. Create snapshot on source
  console.log('═══ Creating source snapshot ═══')
  console.log(`  URL: ${sourceUrl}`)
  console.log(`  Site: ${sourceSiteId}`)

  const snapshot = await source.createSnapshot(sourceSiteId, `copy-${new Date().toISOString()}`)
  console.log(`  Snapshot: ${snapshot._id} (${((snapshot.sizeBytes || 0) / 1024).toFixed(0)}KB)`)

  // 2. Export snapshot data
  console.log('\n═══ Exporting snapshot data ═══')
  const exported = await source.exportSnapshot(snapshot._id)
  const snapshotData = exported.data

  const pages = (snapshotData.pages as any[]) || []
  const blocks = (snapshotData.blocks as any[]) || []
  const partials = (snapshotData.partials as any[]) || []
  const layouts = (snapshotData.layouts as any[]) || []
  const postTypes = (snapshotData.postTypes as any[]) || []
  const folders = (snapshotData.folders as any[]) || []
  const site = snapshotData.site as Record<string, unknown> || {}

  console.log(`  Pages: ${pages.length}`)
  console.log(`  Blocks: ${blocks.length}`)
  console.log(`  Partials: ${partials.length}`)
  console.log(`  Layouts: ${layouts.length}`)
  console.log(`  Post types: ${postTypes.length}`)
  console.log(`  Folders: ${folders.length}`)

  // 3. Create or connect to target site
  console.log('\n═══ Preparing target site ═══')
  console.log(`  URL: ${targetUrl}`)

  if (!targetSiteId) {
    console.log(`  Creating new site: "${siteName}"...`)
    const newSite = await target.createSite(siteName!)
    targetSiteId = newSite._id
    const newToken = (newSite as any).apiToken
    console.log(`  Created site: ${targetSiteId}`)
    if (newToken) {
      console.log(`  New API token: ${newToken}`)
      console.log(`  (Save this token if you need to access this site later)`)
    }
  } else {
    console.log(`  Using existing site: ${targetSiteId}`)
  }

  // 4. Copy files (before import, so we can rewrite URLs in the snapshot data)
  let urlMap: UrlMap = new Map()
  if (includeFiles) {
    console.log('\n═══ Copying files ═══')
    urlMap = await copyFiles(source, target, sourceSiteId, targetSiteId)
  } else {
    console.log('\n═══ Skipping files (use --files to copy media) ═══')
  }

  // 5. Rewrite URLs in snapshot data if files were copied
  let importData = snapshotData
  if (urlMap.size > 0) {
    console.log('\n═══ Rewriting CDN URLs ═══')
    importData = rewriteUrls(snapshotData, urlMap) as Record<string, unknown>
    console.log(`  Rewrote ${urlMap.size} URL(s) in snapshot data.`)
  }

  // 6. Import snapshot on target
  console.log('\n═══ Importing to target ═══')
  const result = await target.importSnapshot(targetSiteId, importData)
  console.log(`  ${result.message || 'Import complete.'}`)

  // 7. Summary
  console.log('\n═══ Copy complete ═══')
  console.log(`  Blocks:      ${blocks.length}`)
  console.log(`  Partials:    ${partials.length}`)
  console.log(`  Layouts:     ${layouts.length}`)
  console.log(`  Pages:       ${pages.length}`)
  console.log(`  Folders:     ${folders.length}`)
  console.log(`  Post types:  ${postTypes.length}`)
  console.log(`  Files:       ${includeFiles ? `${urlMap.size} rewritten` : 'skipped'}`)
  console.log(`\n  Target site: ${targetSiteId}`)
  console.log(`  Target URL:  ${targetUrl}`)
}

main().catch(err => {
  console.error('Error:', err.message || err)
  process.exit(1)
})
