import mongoose from 'mongoose'

async function main() {
  await mongoose.connect('mongodb://localhost:27017/webstir')
  const db = mongoose.connection.db
  if (db == null) throw new Error('No db')
  const siteId = '69952211cb6e382590893367'

  // Check media for this site
  const collections = await db.listCollections().toArray()
  const collNames = collections.map(c => c.name)
  const mediaCols = collNames.filter(n => /media|asset|file|image|upload/i.test(n))
  console.log('Media-related collections:', mediaCols.length > 0 ? mediaCols : 'none')

  for (const col of mediaCols) {
    const items = await db.collection(col).find({ site_id: siteId }).limit(20).toArray()
    console.log(`\n${col} (${items.length} items):`)
    for (const m of items) {
      console.log(' -', m.name || m.filename || m.key || m._id.toString(), '|', m.url || m.src || m.path || '')
    }
  }

  // Check page state
  const pages = await db.collection('pages').find({ site_id: siteId }).toArray()
  for (const p of pages) {
    console.log('\nPage:', p.name, '- blocks:', (p.blocks || []).length)
  }

  // Check blocks
  const blocks = await db.collection('blocks').find({ site_id: siteId }).toArray()
  console.log('\nBlocks:', blocks.map(b => b.name).join(', '))

  await mongoose.disconnect()
}
main().catch(e => { console.error(e); process.exit(1) })
