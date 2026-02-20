import mongoose from 'mongoose'

async function main() {
  await mongoose.connect('mongodb://localhost:27017/webstir')
  const db = mongoose.connection.db
  if (db == null) throw new Error('No db')

  const siteId = '69952211cb6e382590893367'

  // Check site doc for layouts
  const site = await db.collection('sites').findOne({ _id: new mongoose.Types.ObjectId(siteId) })
  if (site) {
    console.log('=== Site ===')
    console.log('Layouts:', JSON.stringify(site.layouts, null, 2))
    console.log('Default layout:', site.defaultLayout || site.defaultLayoutId || 'none')
  }

  // Check all pages for layout settings
  const pages = await db.collection('pages').find({
    site_id: { $in: [siteId, new mongoose.Types.ObjectId(siteId)] }
  }).toArray()

  // Filter to non-post pages
  const nonPostPages = pages.filter(p => p.postTypeId == null)

  console.log('\n=== Pages (non-post) ===')
  for (const p of nonPostPages) {
    console.log(`  ${p._id.toString()} "${p.name}" slug:${p.slug || '(none)'}`)
    console.log(`    layout: ${p.layout || p.layoutId || p.settings?.layout || p.settings?.layoutId || 'NOT SET'}`)
    console.log(`    settings: ${JSON.stringify(p.settings || {})}`)
  }

  await mongoose.disconnect()
}
main().catch(e => { console.error(e); process.exit(1) })
