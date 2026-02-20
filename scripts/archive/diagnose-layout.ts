/**
 * Read-only: check the layout and its Navbar content for broken links.
 */
import mongoose from 'mongoose'

const siteId = '69952211cb6e382590893367'

async function main() {
  await mongoose.connect('mongodb://localhost:27017/webstir')
  const db = mongoose.connection.db
  if (!db) throw new Error('No db')

  const layout = await db.collection('layouts').findOne({
    $or: [{ site_id: siteId }, { site_id: new mongoose.Types.ObjectId(siteId) }],
  })

  if (layout) {
    console.log('=== LAYOUT ===')
    console.log(`Name: ${layout.name}`)
    console.log(`Blocks: ${layout.blocks?.length || 0}`)
    if (layout.blocks) {
      for (const b of layout.blocks) {
        console.log(`\n  Block: ${b.name} (${b.id})`)
        if (b.content) {
          console.log('  Content keys:', Object.keys(b.content))
          for (const [key, val] of Object.entries(b.content)) {
            const v = val as any
            if (Array.isArray(v?.value)) {
              for (const item of v.value) {
                if (item.url !== undefined) {
                  console.log(`    nav: label="${item.label}" url="${item.url}"`)
                }
              }
            } else if (typeof v?.value === 'string') {
              console.log(`    ${key}: "${v.value}"`)
            }
          }
        }
      }
    }
  }

  // Also check the Navbar block's default field values on the remote
  const navbarBlock = await db.collection('blocks').findOne({
    name: 'Navbar',
    $or: [{ site_id: siteId }, { site_id: new mongoose.Types.ObjectId(siteId) }],
  })
  if (navbarBlock?.fields) {
    console.log('\n=== NAVBAR BLOCK FIELDS (defaults) ===')
    for (const f of navbarBlock.fields) {
      if (f.name === 'nav-links' || f.type === 'items') {
        console.log(`  Field: ${f.name} (${f.type})`)
        if (Array.isArray(f.value)) {
          for (const item of f.value) {
            if (item.url !== undefined) {
              console.log(`    label="${item.label}" url="${item.url}"`)
            }
          }
        }
      }
    }
  }

  // Check the lessons index page more carefully
  const pages = await db.collection('pages').find({
    $or: [{ site_id: siteId }, { site_id: new mongoose.Types.ObjectId(siteId) }],
  }).toArray()

  const lessonsPage = pages.find(p => p.slug === 'lessons')
  if (lessonsPage) {
    console.log('\n=== LESSONS INDEX PAGE ===')
    console.log(`Name: ${lessonsPage.name}, slug: ${lessonsPage.slug}`)
    console.log(`Blocks: ${lessonsPage.blocks?.length || 0}`)
    if (lessonsPage.blocks) {
      for (const b of lessonsPage.blocks) {
        console.log(`  Block: ${b.name}`)
        if (b.content) {
          for (const [key, val] of Object.entries(b.content)) {
            const v = val as any
            if (Array.isArray(v?.value) && v.value.length > 0 && v.value[0]?.link !== undefined) {
              console.log(`  Items field ${key}:`)
              for (const item of v.value) {
                console.log(`    "${item.title}" → ${item.link}`)
              }
            }
          }
        }
      }
    }
  }

  // Check the postType for slug/path more carefully
  const pt = await db.collection('posttypes').findOne({
    $or: [{ site_id: siteId }, { site_id: new mongoose.Types.ObjectId(siteId) }],
  })
  if (pt) {
    console.log('\n=== POST TYPE FULL DOCUMENT ===')
    console.log(JSON.stringify(pt, null, 2))
  }

  await mongoose.disconnect()
}

main().catch(e => { console.error(e); process.exit(1) })
