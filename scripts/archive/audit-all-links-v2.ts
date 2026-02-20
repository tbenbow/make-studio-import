/**
 * Comprehensive link audit - checks ALL string values for anything link-like.
 */

import mongoose from 'mongoose'

const siteId = '69952211cb6e382590893367'

interface LinkRef {
  link: string
  page: string
  pageSlug: string
  block: string
  fieldKey: string
}

function deepScan(
  obj: any,
  page: string,
  pageSlug: string,
  block: string,
  key: string,
  refs: LinkRef[]
) {
  if (typeof obj === 'string') {
    // Internal paths
    if (obj.startsWith('/') && !obj.startsWith('//')) {
      refs.push({ link: obj, page, pageSlug, block, fieldKey: key })
    }
    // okgosandbox.org links (should have been migrated)
    if (obj.includes('okgosandbox.org')) {
      refs.push({ link: obj, page, pageSlug, block, fieldKey: `${key}[external-okgo]` })
    }
    // Links in HTML
    const hrefMatches = obj.matchAll(/href="([^"]+)"/g)
    for (const m of hrefMatches) {
      if (m[1].startsWith('/') || m[1].includes('okgosandbox.org')) {
        refs.push({ link: m[1], page, pageSlug, block, fieldKey: `${key}[href]` })
      }
    }
    return
  }
  if (Array.isArray(obj)) {
    obj.forEach((item, i) => deepScan(item, page, pageSlug, block, `${key}[${i}]`, refs))
    return
  }
  if (obj && typeof obj === 'object') {
    for (const [k, v] of Object.entries(obj)) {
      deepScan(v, page, pageSlug, block, key ? `${key}.${k}` : k, refs)
    }
  }
}

async function main() {
  await mongoose.connect('mongodb://localhost:27017/webstir')
  const db = mongoose.connection.db
  if (db == null) throw new Error('No db')

  const validRoutes = new Set<string>()
  validRoutes.add('/')
  validRoutes.add('#')
  validRoutes.add('')

  const pages = await db.collection('pages').find({
    $or: [
      { site_id: siteId },
      { site_id: new mongoose.Types.ObjectId(siteId) },
    ],
  }).toArray()

  const postTypes = await db.collection('posttypes').find({ site_id: siteId }).toArray()
  const postTypeMap = new Map(postTypes.map(pt => [pt._id.toString(), pt]))

  for (const page of pages) {
    const slug = page.slug
    if (!slug || slug === 'undefined') continue
    if (page.postTypeId) {
      const pt = postTypeMap.get(page.postTypeId.toString())
      if (pt) {
        const ptPath = pt.path || pt.slug || 'resources'
        validRoutes.add(`/${ptPath}/${slug}.html`)
        validRoutes.add(`/${ptPath}/${slug}`)
      }
    } else {
      validRoutes.add(`/${slug}`)
    }
  }

  const allLinks: LinkRef[] = []
  for (const page of pages) {
    if (Array.isArray(page.blocks)) {
      for (const block of page.blocks) {
        if (!block.content) continue
        deepScan(block.content, page.name, page.slug, block.name || 'unknown', '', allLinks)
      }
    }
    if (page.content && typeof page.content === 'object') {
      for (const [blockId, fields] of Object.entries(page.content) as any) {
        if (!fields || typeof fields !== 'object') continue
        deepScan(fields, page.name, page.slug, blockId, '', allLinks)
      }
    }
  }

  // Categorize
  const categories = {
    valid: [] as LinkRef[],
    broken: [] as LinkRef[],
    okgosandbox: [] as LinkRef[],
    youtube: [] as LinkRef[],
    external: [] as LinkRef[],
    image: [] as LinkRef[],
    anchor: [] as LinkRef[],
  }

  for (const ref of allLinks) {
    const l = ref.link
    if (l.includes('okgosandbox.org') && !l.match(/\.(jpg|png|webp|gif|svg)/)) {
      categories.okgosandbox.push(ref)
    } else if (l.includes('youtube') || l.includes('youtu.be')) {
      categories.youtube.push(ref)
    } else if (l.match(/^https?:\/\//)) {
      categories.external.push(ref)
    } else if (l.match(/\.(webp|jpg|png|gif|svg)/)) {
      categories.image.push(ref)
    } else if (l === '#' || l === '/') {
      categories.anchor.push(ref)
    } else if (l.startsWith('/')) {
      const variants = [l, l.replace(/\/$/, ''), l.replace(/\.html$/, ''), l + '.html']
      if (variants.some(v => validRoutes.has(v))) {
        categories.valid.push(ref)
      } else {
        categories.broken.push(ref)
      }
    }
  }

  console.log(`=== LINK AUDIT SUMMARY ===`)
  console.log(`Valid internal: ${categories.valid.length}`)
  console.log(`Broken internal: ${categories.broken.length}`)
  console.log(`okgosandbox.org refs: ${categories.okgosandbox.length}`)
  console.log(`YouTube embeds: ${categories.youtube.length}`)
  console.log(`External: ${categories.external.length}`)
  console.log(`Images: ${categories.image.length}`)
  console.log(`Anchors (#, /): ${categories.anchor.length}`)

  if (categories.broken.length > 0) {
    console.log(`\n=== BROKEN INTERNAL LINKS ===\n`)
    const byTarget = new Map<string, LinkRef[]>()
    for (const ref of categories.broken) {
      const g = byTarget.get(ref.link) || []
      g.push(ref)
      byTarget.set(ref.link, g)
    }
    for (const [link, refs] of [...byTarget.entries()].sort()) {
      console.log(`${link}  (${refs.length}x)`)
      for (const ref of refs) {
        console.log(`  → ${ref.page} (${ref.pageSlug}) / ${ref.block} / ${ref.fieldKey}`)
      }
    }
  }

  if (categories.okgosandbox.length > 0) {
    console.log(`\n=== OKGOSANDBOX.ORG REFERENCES (should be migrated) ===\n`)
    const byTarget = new Map<string, LinkRef[]>()
    for (const ref of categories.okgosandbox) {
      const g = byTarget.get(ref.link) || []
      g.push(ref)
      byTarget.set(ref.link, g)
    }
    for (const [link, refs] of [...byTarget.entries()].sort()) {
      console.log(`${link}  (${refs.length}x)`)
      for (const ref of refs.slice(0, 3)) {
        console.log(`  → ${ref.page} (${ref.pageSlug}) / ${ref.block}`)
      }
      if (refs.length > 3) console.log(`  ... and ${refs.length - 3} more`)
    }
  }

  await mongoose.disconnect()
}

main().catch(e => { console.error(e); process.exit(1) })
