import mongoose from 'mongoose'

async function main() {
  await mongoose.connect('mongodb://localhost:27017/webstir')
  const db = mongoose.connection.db
  if (db == null) throw new Error('No db')

  const siteId = '69952211cb6e382590893367'

  // Get all pages
  const allPages = await db.collection('pages').find({
    site_id: { $in: [siteId, new mongoose.Types.ObjectId(siteId)] },
  }).toArray()

  // Build a map of valid slugs/paths
  const validPaths = new Set<string>()
  const pagesByPath = new Map<string, string>()

  // Get the post type for resource posts
  const postType = await db.collection('posttypes').findOne({ site_id: siteId })

  for (const p of allPages) {
    if (p.slug) {
      const path = '/' + p.slug
      validPaths.add(path)
      pagesByPath.set(path, `${p.name} (${p._id.toString()})`)

      // Resource posts are nested under their parent
      if (p.postTypeId) {
        // Find parent slug from content (breadcrumb link)
        const content = p.content || {}
        for (const blockContent of Object.values(content) as any[]) {
          for (const fieldVal of Object.values(blockContent) as any[]) {
            if (fieldVal?.value && typeof fieldVal.value === 'string' && fieldVal.value.startsWith('/')) {
              const parentSlug = fieldVal.value
              const fullPath = parentSlug + '/' + p.slug
              validPaths.add(fullPath)
              pagesByPath.set(fullPath, `${p.name} (post)`)
            }
          }
        }
      }
    }
  }

  // Also add known paths
  validPaths.add('/')
  validPaths.add('#')
  validPaths.add('#lessons')

  console.log('=== Valid paths ===')
  const sortedPaths = [...validPaths].sort()
  for (const p of sortedPaths) {
    const label = pagesByPath.get(p) || ''
    console.log(`  ${p} ${label ? '→ ' + label : ''}`)
  }

  // Now scan all pages for internal links
  console.log('\n=== Link audit ===')

  function extractLinks(value: any, path: string[] = []): { link: string; context: string }[] {
    const links: { link: string; context: string }[] = []
    if (typeof value === 'string') {
      // Check if this is a link-like field
      if (value.startsWith('/') || value.startsWith('#')) {
        links.push({ link: value, context: path.join(' > ') })
      }
      // Check for links in HTML content
      const hrefMatches = value.matchAll(/href="(\/[^"]*?)"/g)
      for (const m of hrefMatches) {
        links.push({ link: m[1], context: path.join(' > ') + ' (href)' })
      }
    } else if (Array.isArray(value)) {
      for (let i = 0; i < value.length; i++) {
        const item = value[i]
        if (typeof item === 'object' && item !== null) {
          for (const [k, v] of Object.entries(item)) {
            if (k === 'id') continue
            links.push(...extractLinks(v, [...path, `[${i}].${k}`]))
          }
        }
      }
    } else if (typeof value === 'object' && value !== null) {
      for (const [k, v] of Object.entries(value)) {
        if (k === 'id') continue
        links.push(...extractLinks(v, [...path, k]))
      }
    }
    return links
  }

  const issues: { page: string; link: string; context: string; issue: string }[] = []

  for (const page of allPages) {
    const pageName = `"${page.name}" (${page.slug || 'no slug'})`
    const pageLinks: { link: string; context: string }[] = []

    // Scan blocks
    for (const block of (page.blocks || [])) {
      if (block.content) {
        const links = extractLinks(block.content, [block.name])
        pageLinks.push(...links)
      }
    }

    // Scan content (for posts)
    if (page.content) {
      const links = extractLinks(page.content, ['content'])
      pageLinks.push(...links)
    }

    // Check each link
    for (const { link, context } of pageLinks) {
      if (link === '#' || link.startsWith('#') || link.startsWith('mailto:') || link.startsWith('http')) continue

      // Normalize the link
      const cleanLink = link.replace(/\/$/, '') || '/'

      if (!validPaths.has(cleanLink)) {
        issues.push({ page: pageName, link: cleanLink, context, issue: 'BROKEN — no matching page' })
      }
    }
  }

  // Also check for resource posts linking to wrong parents
  console.log('\n=== Resource post parent links ===')
  const resourcePosts = allPages.filter(p => p.postTypeId)
  for (const post of resourcePosts) {
    const content = post.content || {}
    for (const [blockId, blockContent] of Object.entries(content) as any[]) {
      for (const [fieldId, fieldVal] of Object.entries(blockContent) as any[]) {
        const val = (fieldVal as any)?.value
        // Check breadcrumb link
        if (typeof val === 'string' && val.startsWith('/') && !val.includes('/' + post.slug)) {
          // This is likely the parent link
          const expectedPath = val + '/' + post.slug
          if (!validPaths.has(expectedPath) && !validPaths.has(val)) {
            issues.push({
              page: `"${post.name}" (post: ${post.slug})`,
              link: val,
              context: 'breadcrumb parent link',
              issue: `Parent path "${val}" doesn't match a page slug`,
            })
          }
        }
        // Check related resource links
        if (Array.isArray(val)) {
          for (const item of val) {
            if (item.link && typeof item.link === 'string' && item.link.startsWith('/')) {
              if (!validPaths.has(item.link)) {
                issues.push({
                  page: `"${post.name}" (post: ${post.slug})`,
                  link: item.link,
                  context: `related item "${item.title || ''}"`,
                  issue: 'Related resource link doesn\'t match a valid path',
                })
              }
            }
          }
        }
      }
    }
  }

  // Also check lesson page ResourceCards links
  console.log('\n=== Lesson page resource card links ===')
  const lessonPages = allPages.filter(p => !p.postTypeId && p.blocks?.some((b: any) => b.name === 'ResourceCards'))
  for (const page of lessonPages) {
    const rcBlock = page.blocks.find((b: any) => b.name === 'ResourceCards')
    if (!rcBlock?.content) continue
    for (const [fieldId, fieldVal] of Object.entries(rcBlock.content) as any[]) {
      const items = (fieldVal as any)?.value
      if (!Array.isArray(items)) continue
      for (const item of items) {
        if (item.link && !validPaths.has(item.link)) {
          issues.push({
            page: `"${page.name}" (${page.slug || 'no slug'})`,
            link: item.link,
            context: `ResourceCard "${item.title || ''}"`,
            issue: 'Resource card link doesn\'t match a valid path',
          })
        }
      }
    }
  }

  // Print issues
  if (issues.length === 0) {
    console.log('\nNo link issues found!')
  } else {
    console.log(`\n=== ${issues.length} ISSUES FOUND ===`)
    for (const issue of issues) {
      console.log(`\n  PAGE: ${issue.page}`)
      console.log(`  LINK: ${issue.link}`)
      console.log(`  WHERE: ${issue.context}`)
      console.log(`  ISSUE: ${issue.issue}`)
    }
  }

  // Summary of all internal links
  console.log('\n\n=== All internal links by page ===')
  for (const page of allPages) {
    const pageName = `"${page.name}" (${page.slug || 'no slug'})`
    const pageLinks: { link: string; context: string }[] = []

    for (const block of (page.blocks || [])) {
      if (block.content) {
        pageLinks.push(...extractLinks(block.content, [block.name]))
      }
    }
    if (page.content) {
      pageLinks.push(...extractLinks(page.content, ['content']))
    }

    const internalLinks = pageLinks.filter(l => l.link.startsWith('/') && !l.link.startsWith('//'))
    if (internalLinks.length > 0) {
      console.log(`\n  ${pageName}`)
      for (const l of internalLinks) {
        const valid = validPaths.has(l.link.replace(/\/$/, '') || '/')
        console.log(`    ${valid ? 'OK' : 'XX'} ${l.link} (${l.context})`)
      }
    }
  }

  await mongoose.disconnect()
}
main().catch(e => { console.error(e); process.exit(1) })
