import mongoose from 'mongoose'

async function main() {
  await mongoose.connect('mongodb://localhost:27017/webstir')
  const db = mongoose.connection.db
  if (db == null) throw new Error('No db')

  const siteId = '69952211cb6e382590893367'
  const layoutId = '69952211cb6e382590893389'

  // Get all non-post pages
  const pages = await db.collection('pages').find({
    site_id: { $in: [siteId, new mongoose.Types.ObjectId(siteId)] },
    postTypeId: { $exists: false },
  }).toArray()

  let updated = 0
  for (const p of pages) {
    const currentLayoutId = p.settings?.layoutId
    if (currentLayoutId === layoutId) {
      console.log(`  OK  "${p.name}" — already has default layout`)
      continue
    }

    await db.collection('pages').updateOne(
      { _id: p._id },
      {
        $set: {
          'settings.layoutId': layoutId,
          updatedAt: new Date(),
        },
      }
    )
    console.log(`  FIX "${p.name}" — set layoutId to ${layoutId}`)
    updated++
  }

  console.log(`\nDone. Updated ${updated} pages.`)

  await mongoose.disconnect()
}
main().catch(e => { console.error(e); process.exit(1) })
