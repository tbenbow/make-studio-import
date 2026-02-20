/**
 * Update image URLs in page content from old okgosandbox.org URLs to new R2 URLs.
 * Reads the manifest to know which URLs to replace and where they appear.
 */

import fs from 'fs'
import mongoose from 'mongoose'

const siteId = '69952211cb6e382590893367'
const manifestPath = 'themes/okgosandbox/source/images/manifest.json'

interface ManifestEntry {
  url: string
  filename: string
  localPath?: string
  skipped?: boolean
  uploaded?: boolean
  newUrl?: string
  uploadedFilename?: string
  references: Array<{
    page: string
    pageSlug: string
    block: string
    fieldId: string
    fieldPath: string
  }>
}

/**
 * Recursively replace old URL with new URL in any object/array/string.
 * Returns true if any replacement was made.
 */
function replaceUrl(obj: any, oldUrl: string, newUrl: string): boolean {
  if (typeof obj === 'string') return false // strings are immutable, handled by parent
  if (Array.isArray(obj)) {
    let changed = false
    for (let i = 0; i < obj.length; i++) {
      if (typeof obj[i] === 'string' && obj[i] === oldUrl) {
        obj[i] = newUrl
        changed = true
      } else if (typeof obj[i] === 'object' && obj[i] !== null) {
        if (replaceUrl(obj[i], oldUrl, newUrl)) changed = true
      }
    }
    return changed
  }
  if (obj && typeof obj === 'object') {
    let changed = false
    for (const key of Object.keys(obj)) {
      if (typeof obj[key] === 'string' && obj[key] === oldUrl) {
        obj[key] = newUrl
        changed = true
      } else if (typeof obj[key] === 'object' && obj[key] !== null) {
        if (replaceUrl(obj[key], oldUrl, newUrl)) changed = true
      }
    }
    return changed
  }
  return false
}

async function main() {
  await mongoose.connect('mongodb://localhost:27017/webstir')
  const db = mongoose.connection.db
  if (db == null) throw new Error('No db')

  const manifest: ManifestEntry[] = JSON.parse(fs.readFileSync(manifestPath, 'utf8'))

  // Build URL replacement map from uploaded entries
  const replacements = manifest
    .filter(e => e.uploaded && e.newUrl)
    .map(e => ({ oldUrl: e.url, newUrl: e.newUrl! }))

  console.log(`${replacements.length} URL replacements to apply\n`)

  // Get all pages for this site
  const pages = await db.collection('pages').find({
    $or: [
      { site_id: siteId },
      { site_id: new mongoose.Types.ObjectId(siteId) },
    ],
  }).toArray()

  console.log(`Scanning ${pages.length} pages...\n`)

  let pagesUpdated = 0
  let totalReplacements = 0

  for (const page of pages) {
    let pageChanged = false
    let pageReplacements = 0

    // Check blocks[].content (lesson pages)
    if (Array.isArray(page.blocks)) {
      for (const block of page.blocks) {
        if (!block.content) continue
        for (const { oldUrl, newUrl } of replacements) {
          if (replaceUrl(block.content, oldUrl, newUrl)) {
            pageChanged = true
            pageReplacements++
          }
        }
      }
    }

    // Check top-level content (resource posts)
    if (page.content && typeof page.content === 'object') {
      for (const { oldUrl, newUrl } of replacements) {
        if (replaceUrl(page.content, oldUrl, newUrl)) {
          pageChanged = true
          pageReplacements++
        }
      }
    }

    if (pageChanged) {
      const updateFields: any = {}
      if (Array.isArray(page.blocks)) updateFields.blocks = page.blocks
      if (page.content) updateFields.content = page.content

      await db.collection('pages').updateOne(
        { _id: page._id },
        { $set: updateFields }
      )
      console.log(`  ${page.name} (${page.slug}): ${pageReplacements} replacements`)
      pagesUpdated++
      totalReplacements += pageReplacements
    }
  }

  console.log(`\nDone: ${totalReplacements} replacements across ${pagesUpdated} pages`)

  await mongoose.disconnect()
}

main().catch(e => {
  console.error(e)
  process.exit(1)
})
