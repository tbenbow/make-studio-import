#!/usr/bin/env npx tsx
/**
 * Copy Site Between Environments
 *
 * Copies a complete site (blocks, partials, theme, layouts, pages, post types)
 * from one Make Studio environment to another.
 *
 * Usage:
 *   npx tsx scripts/copy-site.ts \
 *     --source-url=https://api.makestudio.cc --source-token=xxx --source-site=abc123 \
 *     --target-url=http://localhost:5001 --target-token=yyy \
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
 *   --files          Copy media files (default: skip, content keeps source URLs)
 *
 * If --target-site is omitted, a new site is created using --name.
 * If --target-site is provided, existing content on that site will be overwritten.
 *
 * File copying (--files):
 *   Downloads files from the source CDN and re-uploads to the target via presigned
 *   URLs. All file references in page content, block fields, and theme are rewritten
 *   to point to the target site's CDN path.
 *   NOTE: Requires the target server to accept API tokens on /files routes.
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

// ─── ID remapping helpers ───

type IdMap = Map<string, string>
type UrlMap = Map<string, string>

function remapBlockId(blockId: string, blockIdMap: IdMap): string {
  return blockIdMap.get(blockId) || blockId
}

function remapPageBlocks(
  pageBlocks: any[],
  blockIdMap: IdMap,
  urlMap?: UrlMap
): any[] {
  return pageBlocks.map(pb => {
    const remapped: any = {
      ...pb,
      blockId: remapBlockId(pb.blockId, blockIdMap),
    }
    if (urlMap && urlMap.size > 0 && remapped.content) {
      remapped.content = rewriteUrls(remapped.content, urlMap)
    }
    return remapped
  })
}

function remapLayoutBlocks(
  layoutBlocks: any[] | undefined,
  blockIdMap: IdMap,
  urlMap?: UrlMap
): any[] {
  if (!layoutBlocks || !Array.isArray(layoutBlocks)) return []
  return layoutBlocks.map(lb => {
    const remapped: any = {
      ...lb,
      blockId: remapBlockId(lb.blockId, blockIdMap),
    }
    if (urlMap && urlMap.size > 0 && remapped.content) {
      remapped.content = rewriteUrls(remapped.content, urlMap)
    }
    return remapped
  })
}

function remapPageSettings(
  settings: Record<string, unknown> | undefined,
  layoutIdMap: IdMap
): Record<string, unknown> | undefined {
  if (!settings) return settings
  const remapped = { ...settings }
  if (remapped.layoutId && typeof remapped.layoutId === 'string') {
    remapped.layoutId = layoutIdMap.get(remapped.layoutId) || remapped.layoutId
  }
  return remapped
}

// ─── URL rewriting ───

/**
 * Recursively walk a data structure, replacing any string values that match
 * URLs in the urlMap. This handles page content, block fields, theme values, etc.
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

// ─── File copying ───

const CDN_DOMAIN = 'makestudio.site'

/**
 * Find all CDN URLs referencing the source site in a data structure.
 */
function findFileUrls(data: unknown, siteId: string, found: Set<string>): void {
  const prefix = `https://${CDN_DOMAIN}/${siteId}/`
  if (typeof data === 'string') {
    // Extract URLs from strings (could be in HTML or plain values)
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

/**
 * Copy files from source to target. Returns a URL map for rewriting.
 */
async function copyFiles(
  source: MakeStudioClient,
  target: MakeStudioClient,
  sourceSiteId: string,
  targetSiteId: string,
  allData: unknown[]
): Promise<UrlMap> {
  const urlMap: UrlMap = new Map()

  // 1. Collect all file URLs referenced in the data
  const fileUrls = new Set<string>()
  for (const data of allData) {
    findFileUrls(data, sourceSiteId, fileUrls)
  }

  if (fileUrls.size === 0) {
    console.log('  No file URLs found in content.')
    return urlMap
  }

  console.log(`  Found ${fileUrls.size} file URL(s) to copy.`)

  // 2. For each file: download from source CDN, upload to target
  let copied = 0
  let failed = 0

  for (const sourceFileUrl of fileUrls) {
    const filename = sourceFileUrl.split('/').pop()!
    const contentType = guessContentType(filename)

    try {
      // Download from source CDN
      const response = await fetch(sourceFileUrl)
      if (!response.ok) {
        console.log(`  SKIP ${filename} (download failed: ${response.status})`)
        failed++
        continue
      }
      const fileBuffer = Buffer.from(await response.arrayBuffer())

      // Get presigned upload URL from target
      const { uploadUrl, key } = await target.generateUploadUrl(targetSiteId, {
        filename,
        contentType,
      })

      // Upload to target R2
      const uploadResponse = await fetch(uploadUrl, {
        method: 'PUT',
        headers: { 'Content-Type': contentType },
        body: fileBuffer,
      })

      if (!uploadResponse.ok) {
        console.log(`  SKIP ${filename} (upload failed: ${uploadResponse.status})`)
        failed++
        continue
      }

      // Register the file on target
      const registered = await target.registerFile(targetSiteId, {
        key,
        filename,
        contentType,
        size: fileBuffer.length,
      })

      // Build URL map entry
      const targetFileUrl = registered.url || `https://${CDN_DOMAIN}/${targetSiteId}/${filename}`
      urlMap.set(sourceFileUrl, targetFileUrl)

      console.log(`  OK ${filename} (${(fileBuffer.length / 1024).toFixed(0)}KB)`)
      copied++
    } catch (err: any) {
      console.log(`  FAIL ${filename}: ${err.message}`)
      failed++
    }
  }

  console.log(`  Files: ${copied} copied, ${failed} failed`)
  return urlMap
}

function guessContentType(filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase()
  switch (ext) {
    case 'webp': return 'image/webp'
    case 'jpg': case 'jpeg': return 'image/jpeg'
    case 'png': return 'image/png'
    case 'gif': return 'image/gif'
    case 'svg': return 'image/svg+xml'
    case 'mp4': return 'video/mp4'
    case 'webm': return 'video/webm'
    case 'pdf': return 'application/pdf'
    default: return 'application/octet-stream'
  }
}

// ─── Main ───

async function main() {
  const source = new MakeStudioClient(sourceUrl, sourceToken)
  const target = new MakeStudioClient(targetUrl, targetToken)

  // 1. Pull everything from source
  console.log('═══ Reading source site ═══')
  console.log(`  URL: ${sourceUrl}`)
  console.log(`  Site: ${sourceSiteId}`)

  const [sourceSite, sourceBlocks, sourcePartialsRes, sourcePages, sourceLayouts, sourcePostTypes] =
    await Promise.all([
      source.getSite(sourceSiteId),
      source.getBlocks(sourceSiteId),
      source.getPartials(sourceSiteId),
      source.getPages(sourceSiteId),
      source.getLayouts(sourceSiteId),
      source.getPostTypes(sourceSiteId),
    ])
  const sourcePartials = sourcePartialsRes.partials

  console.log(`  Site name: ${sourceSite.name}`)
  console.log(`  Blocks: ${sourceBlocks.length}`)
  console.log(`  Partials: ${sourcePartials.length}`)
  console.log(`  Pages: ${sourcePages.length}`)
  console.log(`  Layouts: ${sourceLayouts.length}`)
  console.log(`  Post types: ${sourcePostTypes.length}`)

  // Fetch full page data (getPages returns summaries, we need blocks/content)
  console.log('  Fetching full page data...')
  const sourcePagesFull = await Promise.all(
    sourcePages.map((p: any) => source.getPage(p._id))
  )

  // 2. Create or connect to target site
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

  // 3. Copy files (before everything else, so we have the URL map)
  let urlMap: UrlMap = new Map()
  if (includeFiles) {
    console.log('\n═══ Copying files ═══')
    urlMap = await copyFiles(source, target, sourceSiteId, targetSiteId, [
      sourceSite.theme,
      sourceBlocks,
      sourcePartials,
      sourcePagesFull,
      sourceLayouts,
    ])
  } else {
    console.log('\n═══ Skipping files (use --files to copy media) ═══')
  }

  // 4. Check what already exists on target
  const [existingBlocks, existingPartialsRes, existingLayouts, existingPages] = await Promise.all([
    target.getBlocks(targetSiteId),
    target.getPartials(targetSiteId),
    target.getLayouts(targetSiteId),
    target.getPages(targetSiteId),
  ])
  const existingPartials = existingPartialsRes.partials
  const existingBlocksByName = new Map(existingBlocks.map(b => [b.name, b]))
  const existingPartialsByName = new Map(existingPartials.map(p => [p.name, p]))
  const existingLayoutsByName = new Map(existingLayouts.map(l => [l.name, l]))

  // 5. Copy blocks (preserving field UUIDs so page content keys stay valid)
  console.log('\n═══ Copying blocks ═══')
  const blockIdMap: IdMap = new Map()

  for (const block of sourceBlocks) {
    // Rewrite file URLs in block templates and field values
    const template = urlMap.size > 0 ? rewriteUrls(block.template, urlMap) as string : block.template
    const fields = urlMap.size > 0 ? rewriteUrls(block.fields, urlMap) as any[] : block.fields

    const existing = existingBlocksByName.get(block.name)
    if (existing) {
      console.log(`  ~ ${block.name} (update)`)
      await target.updateBlock(existing._id, {
        template,
        fields,
        description: block.description,
        thumbnailType: block.thumbnailType,
      })
      blockIdMap.set(block._id, existing._id)
    } else {
      console.log(`  + ${block.name} (create)`)
      const created = await target.createBlock({
        name: block.name,
        site_id: targetSiteId,
        template,
        fields,
        category: block.category || 'section',
      })
      blockIdMap.set(block._id, created._id)
    }
  }

  // 6. Copy partials
  console.log('\n═══ Copying partials ═══')
  const partialIdMap: IdMap = new Map()

  for (const partial of sourcePartials) {
    const template = urlMap.size > 0 ? rewriteUrls(partial.template, urlMap) as string : partial.template

    const existing = existingPartialsByName.get(partial.name)
    if (existing) {
      console.log(`  ~ ${partial.name} (update)`)
      await target.updatePartial(existing._id, { template })
      partialIdMap.set(partial._id, existing._id)
    } else {
      console.log(`  + ${partial.name} (create)`)
      const created = await target.createPartial({
        name: partial.name,
        site_id: targetSiteId,
        template,
      })
      partialIdMap.set(partial._id, created._id)
    }
  }

  // 7. Copy theme
  console.log('\n═══ Copying theme ═══')
  if (sourceSite.theme && Object.keys(sourceSite.theme).length > 0) {
    const theme = urlMap.size > 0 ? rewriteUrls(sourceSite.theme, urlMap) as Record<string, unknown> : sourceSite.theme
    await target.updateSiteTheme(targetSiteId, theme)
    console.log('  Theme copied.')
  } else {
    console.log('  No theme data to copy.')
  }

  // 8. Copy layouts (remap block IDs, rewrite URLs)
  console.log('\n═══ Copying layouts ═══')
  const layoutIdMap: IdMap = new Map()

  for (const layout of sourceLayouts) {
    const headerBlocks = remapLayoutBlocks(layout.headerBlocks, blockIdMap, urlMap)
    const footerBlocks = remapLayoutBlocks(layout.footerBlocks, blockIdMap, urlMap)
    const settings = urlMap.size > 0 ? rewriteUrls(layout.settings, urlMap) as Record<string, unknown> : layout.settings
    const existing = existingLayoutsByName.get(layout.name)

    if (existing) {
      console.log(`  ~ ${layout.name} (update)`)
      await target.updateLayout(existing._id, {
        description: layout.description,
        headerBlocks,
        footerBlocks,
        settings,
        isDefault: layout.isDefault,
      })
      layoutIdMap.set(layout._id, existing._id)
    } else {
      console.log(`  + ${layout.name} (create)`)
      const created = await target.createLayout({
        name: layout.name,
        site_id: targetSiteId,
        description: layout.description,
        headerBlocks,
        footerBlocks,
        settings,
        isDefault: layout.isDefault,
      })
      layoutIdMap.set(layout._id, created._id)
    }
  }

  // 9. Copy post types
  console.log('\n═══ Copying post types ═══')
  const postTypeIdMap: IdMap = new Map()

  for (const pt of sourcePostTypes) {
    const existingPostTypes = await target.getPostTypes(targetSiteId)
    const existing = existingPostTypes.find(e => e.name === pt.name)

    if (existing) {
      console.log(`  ~ ${pt.name} (exists)`)
      postTypeIdMap.set(pt._id, existing._id)
    } else {
      console.log(`  + ${pt.name} (create)`)
      const created = await target.createPostType({
        name: pt.name,
        site_id: targetSiteId,
      })
      postTypeIdMap.set(pt._id, created._id)
    }
  }

  // 10. Copy pages (remap block IDs, layout IDs, parent IDs, post type IDs, rewrite URLs)
  console.log('\n═══ Copying pages ═══')

  // Re-fetch target pages (post type creation may have auto-created some)
  const targetPagesAfterPT = await target.getPages(targetSiteId)
  const targetPagesByName = new Map(targetPagesAfterPT.map((p: any) => [p.name, p]))
  const pageIdMap: IdMap = new Map()

  // Sort: pages without parentId first, then children
  const sortedPages = [...sourcePagesFull].sort((a: any, b: any) => {
    const aHasParent = a.parentId ? 1 : 0
    const bHasParent = b.parentId ? 1 : 0
    return aHasParent - bHasParent
  })

  for (const page of sortedPages) {
    const remappedBlocks = page.blocks ? remapPageBlocks(page.blocks, blockIdMap, urlMap) : []
    const remappedSettings = remapPageSettings(
      urlMap.size > 0 ? rewriteUrls(page.settings, urlMap) as Record<string, unknown> : page.settings,
      layoutIdMap
    )
    const parentId = page.parentId ? (pageIdMap.get(page.parentId) || page.parentId) : undefined
    const postTypeId = page.postTypeId ? (postTypeIdMap.get(page.postTypeId) || page.postTypeId) : undefined

    const existing = targetPagesByName.get(page.name)

    if (existing) {
      console.log(`  ~ ${page.name} (update)`)
      const patch: Record<string, unknown> = {
        blocks: remappedBlocks,
        settings: remappedSettings,
      }
      if (parentId) patch.parentId = parentId
      if (postTypeId) patch.postTypeId = postTypeId
      await target.updatePage(existing._id, patch)
      pageIdMap.set(page._id, existing._id)
    } else {
      console.log(`  + ${page.name} (create)`)
      const createData: Record<string, unknown> = {
        name: page.name,
        site_id: targetSiteId,
        blocks: remappedBlocks,
        settings: remappedSettings,
      }
      if (parentId) createData.parentId = parentId
      if (postTypeId) createData.postTypeId = postTypeId
      const created = await target.createPage(createData as any)
      pageIdMap.set(page._id, created._id)
      targetPagesByName.set(page.name, created)
    }
  }

  // 11. Summary
  console.log('\n═══ Copy complete ═══')
  console.log(`  Blocks:     ${blockIdMap.size}`)
  console.log(`  Partials:   ${partialIdMap.size}`)
  console.log(`  Theme:      copied`)
  console.log(`  Layouts:    ${layoutIdMap.size}`)
  console.log(`  Post types: ${postTypeIdMap.size}`)
  console.log(`  Pages:      ${pageIdMap.size}`)
  console.log(`  Files:      ${includeFiles ? `${urlMap.size} copied` : 'skipped'}`)
  console.log(`\n  Target site: ${targetSiteId}`)
  console.log(`  Target URL:  ${targetUrl}`)
}

main().catch(err => {
  console.error('Error:', err.message || err)
  process.exit(1)
})
