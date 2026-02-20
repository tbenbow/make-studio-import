/**
 * Read-only diagnostic: inspect page state to understand 404s.
 * Does NOT modify any data.
 */
import mongoose from 'mongoose'

const siteId = '69952211cb6e382590893367'

async function main() {
  await mongoose.connect('mongodb://localhost:27017/webstir')
  const db = mongoose.connection.db
  if (!db) throw new Error('No db')

  // Get all pages for this site (both ObjectId and string site_id)
  const pages = await db.collection('pages').find({
    $or: [
      { site_id: siteId },
      { site_id: new mongoose.Types.ObjectId(siteId) },
    ],
  }).toArray()

  console.log(`Total pages: ${pages.length}\n`)

  // Check post type
  const postTypes = await db.collection('posttypes').find({
    $or: [
      { site_id: siteId },
      { site_id: new mongoose.Types.ObjectId(siteId) },
    ],
  }).toArray()
  console.log(`Post types: ${postTypes.length}`)
  for (const pt of postTypes) {
    console.log(`  ${pt.name} (id: ${pt._id}, slug: ${pt.slug}, path: ${pt.path}, site_id type: ${typeof pt.site_id})`)
  }

  console.log('\n=== ALL PAGES ===\n')
  for (const p of pages) {
    const siteIdType = p.site_id instanceof mongoose.Types.ObjectId ? 'ObjectId' : typeof p.site_id
    const postTypeIdType = p.postTypeId
      ? (p.postTypeId instanceof mongoose.Types.ObjectId ? 'ObjectId' : typeof p.postTypeId)
      : 'none'
    console.log(`  ${(p.slug || '?').padEnd(45)} site_id=${siteIdType.padEnd(10)} postTypeId=${postTypeIdType.padEnd(10)} name=${p.name}`)
  }

  // Check site.pages array
  const site = await db.collection('sites').findOne({ _id: new mongoose.Types.ObjectId(siteId) })
  if (site) {
    console.log(`\n=== SITE.PAGES ARRAY (${site.pages?.length || 0} entries) ===\n`)
    for (const sp of (site.pages || [])) {
      console.log(`  ${sp.slug || '?'}  name=${sp.name}`)
    }
  }

  // Check nav links in a sample page's Navbar block content
  const samplePage = pages.find(p => p.slug === 'this-too-shall-pass' && !p.postTypeId)
  if (samplePage && samplePage.blocks) {
    const navBlock = samplePage.blocks.find((b: any) => b.name === 'Navbar')
    if (navBlock?.content) {
      console.log('\n=== NAVBAR CONTENT (from this-too-shall-pass lesson) ===\n')
      // Find the nav-links field
      for (const [key, val] of Object.entries(navBlock.content)) {
        const v = val as any
        if (Array.isArray(v?.value)) {
          const items = v.value
          if (items.length > 0 && items[0]?.url !== undefined) {
            console.log(`Field ${key} (nav-links):`)
            for (const item of items) {
              console.log(`  label="${item.label}" url="${item.url}"`)
            }
          }
        }
      }
    }
  }

  // Check lesson index page's LessonCards content
  const lessonsIndex = pages.find(p => p.name === 'Index' && !p.postTypeId && p.blocks?.some((b: any) => b.name === 'LessonCards'))
  if (lessonsIndex && lessonsIndex.blocks) {
    const lcBlock = lessonsIndex.blocks.find((b: any) => b.name === 'LessonCards')
    if (lcBlock?.content) {
      console.log('\n=== LESSONCARDS CONTENT (from lessons index) ===\n')
      for (const [key, val] of Object.entries(lcBlock.content)) {
        const v = val as any
        if (Array.isArray(v?.value)) {
          const items = v.value
          if (items.length > 0 && items[0]?.link !== undefined) {
            console.log(`Field ${key} (items):`)
            for (const item of items) {
              console.log(`  title="${item.title}" link="${item.link}"`)
            }
          }
        }
      }
    }
  }

  await mongoose.disconnect()
}

main().catch(e => { console.error(e); process.exit(1) })
