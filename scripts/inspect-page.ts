import mongoose from 'mongoose'

async function main() {
  await mongoose.connect('mongodb://localhost:27017/webstir')
  const db = mongoose.connection.db
  if (db == null) throw new Error('No db')

  const siteId = '69952211cb6e382590893367'

  // List all pages
  const pages = await db.collection('pages').find({ site_id: siteId }).toArray()
  console.log('Pages:')
  for (const p of pages) {
    console.log(' -', p._id.toString(), `"${p.name}"`, 'slug:', p.slug || '', '- blocks:', (p.blocks || []).length)
  }

  // Check media file structure
  const media = await db.collection('mediafiles').find({ site_id: siteId }).limit(20).toArray()
  console.log('\nMedia files:', media.length)
  if (media.length > 0) {
    console.log('Sample keys:', Object.keys(media[0]))
    for (const m of media) {
      const fields: Record<string, string> = {}
      for (const [k, v] of Object.entries(m)) {
        if (typeof v === 'string') fields[k] = (v as string).slice(0, 120)
        if (typeof v === 'number') fields[k] = String(v)
      }
      console.log(' -', JSON.stringify(fields))
    }
  }

  // Show a block's field structure for reference
  const blocks = await db.collection('blocks').find({ site_id: siteId }).toArray()
  const hero = blocks.find(b => b.name === 'Hero')
  if (hero) {
    console.log('\nHero block fields:')
    for (const f of hero.fields || []) {
      console.log(' -', f.id, f.name, f.type, 'value:', typeof f.value === 'string' ? f.value.slice(0, 60) : f.value)
    }
  }

  await mongoose.disconnect()
}
main().catch(e => { console.error(e); process.exit(1) })
