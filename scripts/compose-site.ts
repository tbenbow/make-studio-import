/**
 * Unified compose workflow: config-driven site composition from seed blocks.
 *
 * Usage:
 *   npx tsx scripts/compose-site.ts --config=themes/<name>/compose.json [--site-id=xxx] [--dry-run]
 *
 * Config format (compose.json):
 * {
 *   "siteName": "Wax & Pour",
 *   "blocks": ["Navbar", "Hero", "Features Triple", ...],
 *   "theme": { ...server theme object... },
 *   "images": { "hero": "vinyl-record-player.jpg", ... },
 *   "content": {
 *     "Navbar": { "Logo Text": "Wax & Pour", ... },
 *     "Hero": { "Headline": "...", "Photo": "$hero", ... },
 *     ...
 *   }
 * }
 *
 * Image refs in content use "$key" syntax → resolved to CDN URLs after upload.
 *
 * Correct execution order (bakes in all learnings):
 *  1. Create site (or use existing via --site-id)
 *  2. Upload images to R2 → build URL map
 *  3. Register images in media library
 *  4. Push theme
 *  5. Fetch seed blocks + partials
 *  6. Copy partials (Button, Field) — skip if exist
 *  7. Delete ALL existing blocks on target site
 *  8. Create selected blocks from seed
 *  9. Clear layout headerBlocks/footerBlocks (empty arrays)
 * 10. Assign ALL blocks to page (navbar first, footer last)
 * 11. Set content via setPageContent (resolve $image refs)
 * 12. Re-order blocks to desired sequence
 * 13. Deploy preview
 */
import { MakeStudioClient } from '../src/api'
import dotenv from 'dotenv'
import fs from 'fs'
import path from 'path'
import sharp from 'sharp'
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'
import { v4 as uuidv4 } from 'uuid'
dotenv.config()

// ─── Parse CLI args ───
const args = Object.fromEntries(
  process.argv.slice(2).map(a => {
    const [k, ...v] = a.replace(/^--/, '').split('=')
    return [k, v.join('=') || 'true']
  })
)

if (!args.config) {
  console.error('Usage: npx tsx scripts/compose-site.ts --config=themes/<name>/compose.json [--site-id=xxx] [--dry-run]')
  process.exit(1)
}

// ─── Load config ───
const configPath = path.resolve(args.config)
const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'))
const themeDir = path.dirname(configPath)
const imagesDir = path.join(themeDir, 'source', 'images')

const {
  siteName,
  blocks: selectedBlockNames,
  theme,
  images: imageMap,
  content: contentMap,
} = config as {
  siteName: string
  blocks: string[]
  theme: Record<string, unknown>
  images?: Record<string, string>
  content: Record<string, Record<string, unknown>>
}

const dryRun = args['dry-run'] === 'true'

// ─── Env ───
const baseUrl = process.env.MAKE_STUDIO_URL!
const createToken = process.env.MAKE_STUDIO_CREATE_TOKEN!
const seedToken = process.env.SEED_SITE_API_TOKEN!
const seedSiteId = process.env.SEED_SITE_ID!

const R2_ENDPOINT = process.env.R2_ENDPOINT || 'https://cdb9394087febcf07876a341a9ffe487.r2.cloudflarestorage.com'
const R2_ACCESS_KEY = process.env.R2_ACCESS_KEY || ''
const R2_SECRET_KEY = process.env.R2_SECRET_KEY || ''
const R2_BUCKET = process.env.R2_BUCKET || 'make-studio'
const R2_DOMAIN = process.env.R2_DOMAIN || 'makestudio.site'

const s3 = new S3Client({
  region: 'auto',
  endpoint: R2_ENDPOINT,
  credentials: { accessKeyId: R2_ACCESS_KEY, secretAccessKey: R2_SECRET_KEY },
})

// ─── Helpers ───
function sanitize(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, '_')
}

async function uploadImage(localPath: string, filename: string, siteId: string): Promise<string> {
  const input = fs.readFileSync(localPath)
  let pipeline = sharp(input)
  const meta = await pipeline.metadata()
  if ((meta.width || 0) > 2000 || (meta.height || 0) > 2000) {
    pipeline = pipeline.resize(2000, 2000, { fit: 'inside', withoutEnlargement: true })
  }
  const buffer = await pipeline.webp({ quality: 82 }).toBuffer()
  const webpName = sanitize(filename.replace(/\.[^.]+$/, '')) + '.webp'
  const fileKey = `${siteId}/${webpName}`
  const fullPath = `https://${R2_DOMAIN}/${fileKey}`
  await s3.send(new PutObjectCommand({
    Bucket: R2_BUCKET,
    Key: fileKey,
    Body: buffer,
    ContentType: 'image/webp',
  }))
  return fullPath
}

/** Recursively resolve $key image references in content */
function resolveImageRefs(obj: unknown, urls: Record<string, string>): unknown {
  if (typeof obj === 'string' && obj.startsWith('$') && /^\$[a-zA-Z]/.test(obj)) {
    const key = obj.slice(1)
    if (urls[key]) return urls[key]
    console.warn(`  WARN: Image ref "${obj}" not found in URL map`)
    return obj
  }
  if (Array.isArray(obj)) return obj.map(item => resolveImageRefs(item, urls))
  if (obj && typeof obj === 'object') {
    const result: Record<string, unknown> = {}
    for (const [k, v] of Object.entries(obj)) {
      result[k] = resolveImageRefs(v, urls)
    }
    return result
  }
  return obj
}

// ─── Main ───
async function main() {
  console.log(`\n╔══════════════════════════════════════╗`)
  console.log(`║  Compose: ${siteName.padEnd(26)}║`)
  console.log(`╚══════════════════════════════════════╝`)
  console.log(`  Blocks: ${selectedBlockNames.join(', ')}`)
  console.log(`  Images: ${imageMap ? Object.keys(imageMap).length : 0}`)

  if (dryRun) {
    console.log('\n[DRY RUN] Config parsed successfully. Exiting.')
    console.log('  Theme keys:', Object.keys(theme).join(', '))
    console.log('  Content blocks:', Object.keys(contentMap).join(', '))
    return
  }

  // ─── Step 1: Create or use existing site ───
  let siteId: string
  let apiToken: string

  if (args['site-id']) {
    siteId = args['site-id']
    apiToken = process.env.MAKE_STUDIO_TOKEN!
    console.log(`\n[1/13] Using existing site: ${siteId}`)
  } else {
    console.log(`\n[1/13] Creating site: ${siteName}`)
    const createClient = new MakeStudioClient(baseUrl, createToken)
    const result = await createClient.createSite(siteName) as any
    siteId = result._id
    apiToken = result.apiToken
    console.log(`  Site ID: ${siteId}`)
    console.log(`  API Token: ${apiToken}`)
  }

  const client = new MakeStudioClient(baseUrl, apiToken)

  // ─── Step 2: Upload images to R2 ───
  const imageUrls: Record<string, string> = {}
  if (imageMap && Object.keys(imageMap).length > 0) {
    console.log(`\n[2/13] Uploading images to R2`)
    for (const [key, filename] of Object.entries(imageMap)) {
      const localPath = path.join(imagesDir, filename)
      if (!fs.existsSync(localPath)) {
        console.warn(`  WARN: Image file not found: ${localPath}`)
        continue
      }
      const url = await uploadImage(localPath, filename, siteId)
      imageUrls[key] = url
      console.log(`  ${key}: ${filename} → ${url}`)
    }
  } else {
    console.log(`\n[2/13] No images to upload`)
  }

  // ─── Step 3: Register images in media library ───
  if (Object.keys(imageUrls).length > 0) {
    console.log(`\n[3/13] Registering images in media library`)
    const fileEntries = Object.entries(imageUrls).map(([key, url]) => ({
      url,
      fileName: sanitize(imageMap![key]),
    }))
    await client.uploadFilesFromUrls(siteId, fileEntries)
    console.log(`  Registered ${fileEntries.length} files.`)
  } else {
    console.log(`\n[3/13] No images to register`)
  }

  // ─── Step 4: Push theme ───
  console.log(`\n[4/13] Pushing theme`)
  await client.updateSiteTheme(siteId, theme)
  console.log(`  Theme applied.`)

  // ─── Step 5: Fetch seed blocks + partials ───
  console.log(`\n[5/13] Fetching seed blocks`)
  const seedClient = new MakeStudioClient(baseUrl, seedToken)
  const seedBlocks = await seedClient.getBlocks(seedSiteId)
  const { partials: seedPartials } = await seedClient.getPartials(seedSiteId)
  console.log(`  ${seedBlocks.length} seed blocks, ${seedPartials.length} partials`)

  // ─── Step 6: Copy partials ───
  console.log(`\n[6/13] Copying partials`)
  const { partials: existingPartials } = await client.getPartials(siteId)
  for (const partialName of ['Button', 'Field']) {
    if (existingPartials.find((p: any) => p.name === partialName)) {
      console.log(`  ${partialName} already exists`)
      continue
    }
    const seedPartial = seedPartials.find((p: any) => p.name === partialName)
    if (seedPartial) {
      await client.createPartial({ name: partialName, site_id: siteId, template: seedPartial.template })
      console.log(`  Created: ${partialName}`)
    }
  }

  // ─── Step 7: Delete ALL existing blocks ───
  console.log(`\n[7/13] Deleting existing blocks`)
  const existingBlocks = await client.getBlocks(siteId)
  for (const block of existingBlocks) {
    await client.deleteBlock(block._id)
    console.log(`  Deleted: ${block.name}`)
  }

  // ─── Step 8: Create selected blocks from seed ───
  console.log(`\n[8/13] Creating blocks from seed`)
  const createdBlocks: Record<string, any> = {}
  for (const blockName of selectedBlockNames) {
    const seedBlock = seedBlocks.find((b: any) => b.name === blockName)
    if (!seedBlock) {
      console.warn(`  WARN: Seed block "${blockName}" not found — skipping`)
      continue
    }
    const created = await client.createBlock({
      name: seedBlock.name,
      site_id: siteId,
      template: seedBlock.template,
      fields: seedBlock.fields,
      category: seedBlock.category,
    })
    createdBlocks[blockName] = created
    console.log(`  Created: ${blockName} (${(created as any)._id})`)
  }

  // ─── Step 9: Clear layout headerBlocks/footerBlocks ───
  console.log(`\n[9/13] Clearing layout header/footer`)
  const layouts = await client.getLayouts(siteId)
  const defaultLayout = layouts.find((l: any) => l.isDefault) || layouts[0]
  await client.updateLayout(defaultLayout._id, {
    headerBlocks: [],
    footerBlocks: [],
  })
  console.log(`  Layout ${defaultLayout._id} cleared.`)

  // ─── Step 10: Assign ALL blocks to page (navbar first, footer last) ───
  console.log(`\n[10/13] Assigning blocks to page`)
  const pages = await client.getPages(siteId)
  const indexPage = pages.find((p: any) => p.name === 'Index' || p.slug === '/')
  if (!indexPage) {
    console.error('  ERROR: No Index page found')
    process.exit(1)
  }

  // Build ordered block refs: navbar first, content middle, footer last
  const navbarName = selectedBlockNames.find(n => createdBlocks[n]?.category === 'header')
  const footerName = selectedBlockNames.find(n => createdBlocks[n]?.category === 'footer')
  const contentNames = selectedBlockNames.filter(n => n !== navbarName && n !== footerName)

  const orderedNames = [
    ...(navbarName ? [navbarName] : []),
    ...contentNames,
    ...(footerName ? [footerName] : []),
  ]

  const blockRefs = orderedNames
    .filter(name => createdBlocks[name])
    .map(name => ({
      blockId: createdBlocks[name]._id,
      id: uuidv4(),
      name: createdBlocks[name].name,
    }))

  await client.updatePage(indexPage._id, {
    blocks: blockRefs,
    settings: { layoutId: defaultLayout._id },
  })
  console.log(`  Assigned ${blockRefs.length} blocks: ${orderedNames.join(', ')}`)

  // ─── Step 11: Set content via setPageContent ───
  console.log(`\n[11/13] Setting page content`)
  const resolvedContent = resolveImageRefs(contentMap, imageUrls) as Record<string, Record<string, unknown>>
  await client.setPageContent(indexPage._id, resolvedContent)
  console.log(`  Content set for: ${Object.keys(resolvedContent).join(', ')}`)

  // ─── Step 12: Re-order blocks to desired sequence ───
  console.log(`\n[12/13] Re-ordering blocks`)
  const currentPage = await client.getPage(indexPage._id) as any
  const currentBlocks: Array<{ blockId: string; id: string; name: string }> = currentPage.blocks

  // Build ordered refs from current page blocks (preserving instance IDs from setPageContent)
  const reordered: typeof currentBlocks = []
  for (const name of orderedNames) {
    const found = currentBlocks.find(b => b.name === name)
    if (found) reordered.push(found)
  }
  // Append any extras that setPageContent may have added (shouldn't happen with cleared layout)
  for (const b of currentBlocks) {
    if (!reordered.find(r => r.id === b.id)) reordered.push(b)
  }

  await client.updatePage(indexPage._id, { blocks: reordered })
  console.log(`  Order: ${reordered.map(b => b.name).join(', ')}`)

  // ─── Step 13: Deploy preview ───
  console.log(`\n[13/13] Deploying preview`)
  const preview = await client.deployPreview(siteId)
  console.log(`  Preview URL: ${(preview as any).previewUrl || JSON.stringify(preview)}`)

  // ─── Summary ───
  console.log(`\n╔══════════════════════════════════════╗`)
  console.log(`║  Done!                               ║`)
  console.log(`╚══════════════════════════════════════╝`)
  console.log(`  Site ID:   ${siteId}`)
  console.log(`  API Token: ${apiToken}`)
  console.log(`  Blocks:    ${Object.keys(createdBlocks).length}`)
  console.log(`  Images:    ${Object.keys(imageUrls).length}`)
}

main().catch(e => {
  console.error('\nFATAL:', e)
  process.exit(1)
})
