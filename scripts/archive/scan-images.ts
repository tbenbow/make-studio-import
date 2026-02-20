import mongoose from 'mongoose'

const siteId = '69952211cb6e382590893367'

interface ImageRef {
  url: string
  page: string
  pageSlug: string
  block: string
  fieldId: string
  fieldPath: string // e.g. "items[2].image" or "image"
}

function extractImageUrls(
  obj: any,
  page: string,
  pageSlug: string,
  block: string,
  fieldId: string,
  path: string,
  refs: ImageRef[]
) {
  if (typeof obj === 'string') {
    // Match image URLs (common extensions + okgosandbox.org URLs with image paths)
    if (obj.match(/\.(jpg|jpeg|png|gif|svg|webp)(\?.*)?$/i) ||
        (obj.includes('okgosandbox.org') && obj.match(/\/(images|resources|videos)\//))) {
      refs.push({ url: obj, page, pageSlug, block, fieldId, fieldPath: path })
    }
    return
  }
  if (Array.isArray(obj)) {
    obj.forEach((item, i) => {
      extractImageUrls(item, page, pageSlug, block, fieldId, `${path}[${i}]`, refs)
    })
    return
  }
  if (obj && typeof obj === 'object') {
    for (const [key, val] of Object.entries(obj)) {
      extractImageUrls(val, page, pageSlug, block, fieldId, path ? `${path}.${key}` : key, refs)
    }
  }
}

async function main() {
  await mongoose.connect('mongodb://localhost:27017/webstir')
  const db = mongoose.connection.db
  if (db == null) throw new Error('No db')

  const pages = await db.collection('pages').find({
    $or: [
      { site_id: siteId },
      { site_id: new mongoose.Types.ObjectId(siteId) },
    ],
  }).toArray()

  console.log(`Scanning ${pages.length} pages...\n`)

  const allRefs: ImageRef[] = []

  for (const page of pages) {
    // Scan blocks[].content (lesson pages, etc.)
    if (Array.isArray(page.blocks)) {
      for (const block of page.blocks) {
        if (!block.content) continue
        for (const [fieldId, fieldData] of Object.entries(block.content) as any) {
          extractImageUrls(fieldData, page.name, page.slug, block.name, fieldId, '', allRefs)
        }
      }
    }

    // Scan top-level content (resource posts)
    if (page.content && typeof page.content === 'object') {
      for (const [blockId, fields] of Object.entries(page.content) as any) {
        if (!fields || typeof fields !== 'object') continue
        for (const [fieldId, fieldData] of Object.entries(fields) as any) {
          extractImageUrls(fieldData, page.name, page.slug, blockId, fieldId, '', allRefs)
        }
      }
    }
  }

  // Deduplicate by URL and collect all references
  const byUrl = new Map<string, ImageRef[]>()
  for (const ref of allRefs) {
    const existing = byUrl.get(ref.url) || []
    existing.push(ref)
    byUrl.set(ref.url, existing)
  }

  console.log(`Found ${byUrl.size} unique image URLs across ${allRefs.length} references\n`)

  // Print summary
  for (const [url, refs] of byUrl) {
    console.log(url)
    for (const ref of refs) {
      console.log(`  → ${ref.page} (${ref.pageSlug}) / ${ref.block} / ${ref.fieldPath}`)
    }
  }

  // Output as JSON for use by download script
  const manifest = Array.from(byUrl.entries()).map(([url, refs]) => ({
    url,
    filename: url.split('/').pop()?.split('?')[0] || 'unknown',
    references: refs.map(r => ({
      page: r.page,
      pageSlug: r.pageSlug,
      block: r.block,
      fieldId: r.fieldId,
      fieldPath: r.fieldPath,
    })),
  }))

  const fs = await import('fs')
  fs.writeFileSync(
    'themes/okgosandbox/source/images/manifest.json',
    JSON.stringify(manifest, null, 2)
  )
  console.log(`\nManifest written to themes/okgosandbox/source/images/manifest.json`)

  await mongoose.disconnect()
}

main().catch(e => { console.error(e); process.exit(1) })
