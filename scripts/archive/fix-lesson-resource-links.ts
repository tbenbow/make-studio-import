import mongoose from 'mongoose'

const siteId = '69952211cb6e382590893367'

async function main() {
  await mongoose.connect('mongodb://localhost:27017/webstir')
  const db = mongoose.connection.db
  if (db == null) throw new Error('No db')

  // Get all pages for the site
  const pages = await db.collection('pages').find({
    $or: [
      { site_id: siteId },
      { site_id: new mongoose.Types.ObjectId(siteId) },
    ],
  }).toArray()

  console.log(`Found ${pages.length} total pages`)

  let fixedCount = 0

  for (const page of pages) {
    if (!Array.isArray(page.blocks)) continue
    let changed = false

    for (const block of page.blocks) {
      if (!block.content) continue
      for (const [fieldId, fieldData] of Object.entries(block.content) as any) {
        if (!Array.isArray(fieldData?.value)) continue
        for (const item of fieldData.value) {
          if (
            typeof item.link === 'string' &&
            item.link.match(/^\/[^/]+\/[^/]+$/) &&
            !item.link.startsWith('/resources/')
          ) {
            const slug = item.link.split('/').pop()
            const oldLink = item.link
            item.link = `/resources/${slug}.html`
            console.log(`  ${page.name}: ${oldLink} -> ${item.link}`)
            changed = true
          }
        }
      }
    }

    if (changed) {
      await db.collection('pages').updateOne(
        { _id: page._id },
        { $set: { blocks: page.blocks } }
      )
      fixedCount++
    }
  }

  console.log(`\nFixed links on ${fixedCount} pages`)
  await mongoose.disconnect()
}

main().catch(e => { console.error(e); process.exit(1) })
