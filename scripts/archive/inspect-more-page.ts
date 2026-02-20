import mongoose from 'mongoose'

async function main() {
  await mongoose.connect('mongodb://localhost:27017/webstir')
  const db = mongoose.connection.db
  if (db == null) throw new Error('No db')
  const siteId = '69952211cb6e382590893367'

  // The More page
  const morePage = await db.collection('pages').findOne({ _id: new mongoose.Types.ObjectId('69960dbfcb6e38259089fe03') })
  if (morePage == null) throw new Error('No More page')

  console.log('=== More Page ===')
  console.log('Name:', morePage.name)
  console.log('Slug:', morePage.slug)
  console.log('Blocks:', (morePage.blocks || []).length)
  for (const b of (morePage.blocks || [])) {
    console.log('\n  Block:', b.name, 'blockId:', b.blockId)
    if (b.content) {
      for (const [fid, val] of Object.entries(b.content)) {
        const v = (val as any).value
        const preview = typeof v === 'string' ? v.slice(0, 120) : JSON.stringify(v).slice(0, 200)
        console.log('    ', fid, '=', preview)
      }
    }
  }

  // Check VideoGrid block fields
  const videoGrid = await db.collection('blocks').findOne({ name: 'VideoGrid', site_id: siteId })
  if (videoGrid) {
    console.log('\n=== VideoGrid field defs ===')
    for (const f of videoGrid.fields || []) {
      console.log(f.id, '|', f.name, '|', f.type)
    }
  }

  // Check PageHeader block fields
  const pageHeader = await db.collection('blocks').findOne({ name: 'PageHeader', site_id: siteId })
  if (pageHeader) {
    console.log('\n=== PageHeader field defs ===')
    for (const f of pageHeader.fields || []) {
      console.log(f.id, '|', f.name, '|', f.type)
    }
  }

  await mongoose.disconnect()
}
main().catch(e => { console.error(e); process.exit(1) })
