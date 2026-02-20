/**
 * Fix two link issues:
 * 1. Nav links missing .html suffix (/more → /more.html, /about → /about.html, etc.)
 * 2. Breadcrumb/parent links using /{slug} instead of /lessons/{slug}.html
 */

import mongoose from 'mongoose'

const siteId = '69952211cb6e382590893367'

// Nav links that need .html
const navFixMap: Record<string, string> = {
  '/more': '/more.html',
  '/about': '/about.html',
  '/ask-ok-go': '/ask-ok-go.html',
}

// Lesson slugs — breadcrumbs link to these without /lessons/ prefix
const lessonSlugs = [
  'this-too-shall-pass',
  'the-one-moment',
  'the-writings-on-the-wall',
  'upside-down-inside-out',
  'needing-getting',
  'all-together-now',
  'this',
]

function fixLinksInObject(obj: any): number {
  let fixes = 0
  if (typeof obj === 'string') return 0
  if (Array.isArray(obj)) {
    for (let i = 0; i < obj.length; i++) {
      if (typeof obj[i] === 'string') {
        // Fix nav links
        if (navFixMap[obj[i]]) {
          obj[i] = navFixMap[obj[i]]
          fixes++
        }
        // Fix breadcrumb links: /slug → /lessons/slug.html
        for (const slug of lessonSlugs) {
          if (obj[i] === `/${slug}`) {
            obj[i] = `/lessons/${slug}.html`
            fixes++
          }
        }
      } else if (typeof obj[i] === 'object' && obj[i] !== null) {
        fixes += fixLinksInObject(obj[i])
      }
    }
    return fixes
  }
  if (obj && typeof obj === 'object') {
    for (const key of Object.keys(obj)) {
      if (typeof obj[key] === 'string') {
        if (navFixMap[obj[key]]) {
          obj[key] = navFixMap[obj[key]]
          fixes++
        }
        for (const slug of lessonSlugs) {
          if (obj[key] === `/${slug}`) {
            obj[key] = `/lessons/${slug}.html`
            fixes++
          }
        }
      } else if (typeof obj[key] === 'object' && obj[key] !== null) {
        fixes += fixLinksInObject(obj[key])
      }
    }
  }
  return fixes
}

async function main() {
  await mongoose.connect('mongodb://localhost:27017/webstir')
  const db = mongoose.connection.db
  if (db == null) throw new Error('No db')

  const pages = await db.collection('pages').find({ site_id: siteId }).toArray()
  console.log(`Scanning ${pages.length} pages\n`)

  let totalFixes = 0
  let pagesFixed = 0

  for (const page of pages) {
    let pageFixes = 0

    if (Array.isArray(page.blocks)) {
      for (const block of page.blocks) {
        if (block.content) pageFixes += fixLinksInObject(block.content)
      }
    }
    if (page.content) {
      pageFixes += fixLinksInObject(page.content)
    }

    if (pageFixes > 0) {
      const updates: any = {}
      if (page.blocks) updates.blocks = page.blocks
      if (page.content) updates.content = page.content
      await db.collection('pages').updateOne({ _id: page._id }, { $set: updates })
      console.log(`  ${page.name} (${page.slug}): ${pageFixes} fixes`)
      totalFixes += pageFixes
      pagesFixed++
    }
  }

  console.log(`\nFixed ${totalFixes} links across ${pagesFixed} pages`)
  await mongoose.disconnect()
}

main().catch(e => { console.error(e); process.exit(1) })
