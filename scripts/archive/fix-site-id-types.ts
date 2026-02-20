/**
 * Fix site_id type mismatch: some pages have ObjectId, server expects string.
 * Also fixes postTypeId if stored as ObjectId.
 */

import mongoose from 'mongoose'

const siteId = '69952211cb6e382590893367'

async function main() {
  await mongoose.connect('mongodb://localhost:27017/webstir')
  const db = mongoose.connection.db
  if (db == null) throw new Error('No db')

  // Find all pages for this site (both string and ObjectId)
  const pages = await db.collection('pages').find({
    $or: [
      { site_id: siteId },
      { site_id: new mongoose.Types.ObjectId(siteId) },
    ],
  }).toArray()

  console.log(`Total pages: ${pages.length}\n`)

  let fixed = 0

  for (const page of pages) {
    const updates: any = {}

    // Fix site_id: ObjectId → string
    if (page.site_id instanceof mongoose.Types.ObjectId || (typeof page.site_id === 'object' && page.site_id !== null)) {
      updates.site_id = siteId
    }

    // Fix postTypeId: ObjectId → string (if it exists)
    if (page.postTypeId && (page.postTypeId instanceof mongoose.Types.ObjectId || typeof page.postTypeId === 'object')) {
      updates.postTypeId = page.postTypeId.toString()
    }

    if (Object.keys(updates).length > 0) {
      await db.collection('pages').updateOne(
        { _id: page._id },
        { $set: updates }
      )
      console.log(`  Fixed: ${page.name} (${page.slug}) — ${Object.keys(updates).join(', ')}`)
      fixed++
    }
  }

  console.log(`\nFixed ${fixed} pages`)

  // Also check the postType itself
  const postTypes = await db.collection('posttypes').find({ site_id: siteId }).toArray()
  for (const pt of postTypes) {
    if (pt.site_id instanceof mongoose.Types.ObjectId || typeof pt.site_id === 'object') {
      await db.collection('posttypes').updateOne(
        { _id: pt._id },
        { $set: { site_id: siteId } }
      )
      console.log(`Fixed postType: ${pt.name}`)
    }
  }

  await mongoose.disconnect()
}

main().catch(e => { console.error(e); process.exit(1) })
