/**
 * Fix broken links across all pages using the Make Studio API.
 *
 * Fixes:
 * 1. Nav links missing .html suffix (/more → /more.html, etc.)
 * 2. Lesson index links missing /lessons/ prefix and .html suffix
 * 3. Breadcrumb/parent links using /{slug} instead of /lessons/{slug}.html
 */

import { MakeStudioClient } from '../src/api.js'
import dotenv from 'dotenv'
dotenv.config()

const client = new MakeStudioClient(
  process.env.MAKE_STUDIO_URL!,
  process.env.MAKE_STUDIO_TOKEN!
)
const siteId = process.env.MAKE_STUDIO_SITE!

// Nav links that need .html
const navFixMap: Record<string, string> = {
  '/more': '/more.html',
  '/about': '/about.html',
  '/ask-ok-go': '/ask-ok-go.html',
}

// Lesson slugs — breadcrumbs/cards link to these without /lessons/ prefix
const lessonSlugs = [
  'this-too-shall-pass',
  'the-one-moment',
  'the-writings-on-the-wall',
  'upside-down-inside-out',
  'upside-down-and-inside-out',
  'needing-getting',
  'all-together-now',
  'this',
]

function fixLinksInValue(val: any): { fixed: any; count: number } {
  if (typeof val === 'string') {
    // Fix nav links
    if (navFixMap[val]) return { fixed: navFixMap[val], count: 1 }
    // Fix lesson links: /slug → /lessons/slug.html
    for (const slug of lessonSlugs) {
      if (val === `/${slug}`) return { fixed: `/lessons/${slug}.html`, count: 1 }
    }
    return { fixed: val, count: 0 }
  }
  if (Array.isArray(val)) {
    let count = 0
    const fixed = val.map(item => {
      const r = fixLinksInValue(item)
      count += r.count
      return r.fixed
    })
    return { fixed, count }
  }
  if (val && typeof val === 'object') {
    let count = 0
    const fixed: any = {}
    for (const [k, v] of Object.entries(val)) {
      const r = fixLinksInValue(v)
      fixed[k] = r.fixed
      count += r.count
    }
    return { fixed, count }
  }
  return { fixed: val, count: 0 }
}

async function main() {
  const site = await client.getSite(siteId)
  console.log(`Site: ${site.name} (${site.pages.length} pages)\n`)

  let totalFixes = 0
  let pagesFixed = 0

  for (const pageSummary of site.pages) {
    const page = await client.getPage(pageSummary._id)
    let pageFixes = 0
    let updatedBlocks = false
    let updatedContent = false

    // Fix links in blocks[].content
    if (Array.isArray(page.blocks)) {
      for (const block of page.blocks) {
        if (block.content && typeof block.content === 'object') {
          const { fixed, count } = fixLinksInValue(block.content)
          if (count > 0) {
            block.content = fixed
            pageFixes += count
            updatedBlocks = true
          }
        }
      }
    }

    // Fix links in page.content (for post type pages)
    if (page.content && typeof page.content === 'object') {
      const { fixed, count } = fixLinksInValue(page.content)
      if (count > 0) {
        page.content = fixed
        pageFixes += count
        updatedContent = true
      }
    }

    if (pageFixes > 0) {
      const updates: any = {}
      if (updatedBlocks) updates.blocks = page.blocks
      if (updatedContent) updates.content = page.content

      await client.updatePage(pageSummary._id, updates)
      console.log(`  ✓ ${page.name} (${page.slug || '?'}): ${pageFixes} fixes`)
      totalFixes += pageFixes
      pagesFixed++
    }
  }

  console.log(`\nFixed ${totalFixes} links across ${pagesFixed} pages`)
}

main().catch(e => { console.error(e); process.exit(1) })
