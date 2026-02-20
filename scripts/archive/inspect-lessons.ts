import mongoose from 'mongoose'

async function main() {
  await mongoose.connect('mongodb://localhost:27017/webstir')
  const db = mongoose.connection.db
  if (db == null) throw new Error('No db')
  const siteId = '69952211cb6e382590893367'

  // Get all pages
  const pages = await db.collection('pages').find({
    site_id: { $in: [siteId, new mongoose.Types.ObjectId(siteId)] }
  }).toArray()

  console.log('All pages:')
  for (const p of pages) {
    console.log(' -', p._id.toString(), JSON.stringify(p.name), 'slug:', JSON.stringify(p.slug), 'postTypeId:', p.postTypeId?.toString() || 'none', 'blocks:', (p.blocks || []).length)
  }

  // Check the This Too Shall Pass page structure (the one that's populated)
  const ttsp = pages.find(p => p.name === 'This Too Shall Pass' && p.postTypeId == null)
  if (ttsp) {
    console.log('\n=== This Too Shall Pass (populated lesson) ===')
    console.log('Keys:', Object.keys(ttsp))
    console.log('Blocks:', (ttsp.blocks || []).length)
    for (const b of (ttsp.blocks || [])) {
      console.log('  Block:', b.name, 'blockId:', b.blockId)
      if (b.content) {
        for (const [fid, val] of Object.entries(b.content)) {
          const v = (val as any).value
          const preview = typeof v === 'string' ? v.slice(0, 100) : JSON.stringify(v).slice(0, 200)
          console.log('    ', fid, '=', preview)
        }
      }
    }
    console.log('Settings:', JSON.stringify(ttsp.settings, null, 2))
  }

  // Also check what blocks are used for lesson pages (non-post pages)
  const lessonPages = pages.filter(p => p.postTypeId == null && p.slug !== '' && p.slug !== 'lessons')
  console.log('\n=== Lesson pages (non-post, non-index) ===')
  for (const p of lessonPages) {
    console.log(p._id.toString(), JSON.stringify(p.name), 'slug:', p.slug, 'blocks:', (p.blocks || []).length)
  }

  await mongoose.disconnect()
}
main().catch(e => { console.error(e); process.exit(1) })
