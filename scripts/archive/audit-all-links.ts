/**
 * Audit all internal links across the site.
 * Deep-scans every string value in page content for internal paths.
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

function deepExtractLinks(
  obj: any,
  page: string,
  pageSlug: string,
  block: string,
  key: string,
  refs: LinkRef[]
) {
  if (typeof obj === 'string') {
    // Direct internal path
    if (obj.startsWith('/') && !obj.startsWith('//') && !obj.startsWith('/http')) {
      refs.push({ link: obj, page, pageSlug, block, fieldKey: key })
    }
    // Links in HTML content
    const hrefMatches = obj.matchAll(/href="(\/[^"]+)"/g)
    for (const m of hrefMatches) {
      refs.push({ link: m[1], page, pageSlug, block, fieldKey: `${key}[href]` })
    }
    return
  }
  if (Array.isArray(obj)) {
    obj.forEach((item, i) => deepExtractLinks(item, page, pageSlug, block, `${key}[${i}]`, refs))
    return
  }
  if (obj && typeof obj === 'object') {
    for (const [k, v] of Object.entries(obj)) {
      deepExtractLinks(v, page, pageSlug, block, key ? `${key}.${k}` : k, refs)
    }
  }
}

async function main() {
  await mongoose.connect('mongodb://localhost:27017/webstir')
  const db = mongoose.connection.db
  if (db == null) throw new Error('No db')

  // Build valid routes
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
      validRoutes.add(`/${slug}.html`)
    }
  }

  console.log(`Valid routes: ${validRoutes.size}\n`)

  // Extract all links
  const allLinks: LinkRef[] = []

  for (const page of pages) {
    if (Array.isArray(page.blocks)) {
      for (const block of page.blocks) {
        if (!block.content) continue
        deepExtractLinks(block.content, page.name, page.slug, block.name || 'unknown', '', allLinks)
      }
    }
    if (page.content && typeof page.content === 'object') {
      for (const [blockId, fields] of Object.entries(page.content) as any) {
        if (!fields || typeof fields !== 'object') continue
        deepExtractLinks(fields, page.name, page.slug, blockId, '', allLinks)
      }
    }
  }

  // Filter to meaningful internal links
  const internalLinks = allLinks.filter(l =>
    l.link.startsWith('/') &&
    l.link !== '/' &&
    !l.link.startsWith('//') &&
    !l.link.match(/\.(webp|jpg|png|gif|svg)$/)
  )

  console.log(`Internal links found: ${internalLinks.length}\n`)

  // Check each link
  const broken: LinkRef[] = []
  const valid: LinkRef[] = []

  for (const ref of internalLinks) {
    const link = ref.link
    const variants = [link, link.replace(/\/$/, ''), link.replace(/\.html$/, ''), link + '.html']
    const isValid = variants.some(v => validRoutes.has(v))

    if (isValid) {
      valid.push(ref)
    } else {
      broken.push(ref)
    }
  }

  console.log(`Valid: ${valid.length}`)
  console.log(`Broken: ${broken.length}\n`)

  if (broken.length > 0) {
    const byTarget = new Map<string, LinkRef[]>()
    for (const ref of broken) {
      const existing = byTarget.get(ref.link) || []
      existing.push(ref)
      byTarget.set(ref.link, existing)
    }

    console.log('=== BROKEN LINKS ===\n')
    for (const [link, refs] of [...byTarget.entries()].sort()) {
      console.log(`${link}  (${refs.length} occurrence${refs.length > 1 ? 's' : ''})`)
      for (const ref of refs) {
        console.log(`  → ${ref.page} (${ref.pageSlug}) / ${ref.block} / ${ref.fieldKey}`)
      }
    }

    // Suggest fixes
    console.log('\n=== SUGGESTED FIXES ===\n')
    for (const [link] of [...byTarget.entries()].sort()) {
      // Try to find a matching valid route
      const slug = link.split('/').pop()?.replace(/\.html$/, '') || ''
      const possibleMatches = [...validRoutes].filter(r => r.includes(slug) && slug.length > 2)
      if (possibleMatches.length > 0) {
        console.log(`${link} → ${possibleMatches.join(' or ')}`)
      } else {
        console.log(`${link} → NO MATCH FOUND`)
      }
    }
  }

  await mongoose.disconnect()
}

main().catch(e => { console.error(e); process.exit(1) })
