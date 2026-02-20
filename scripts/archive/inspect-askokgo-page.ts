import mongoose from 'mongoose'

async function main() {
  await mongoose.connect('mongodb://localhost:27017/webstir')
  const db = mongoose.connection.db
  if (db == null) throw new Error('No db')

  const page = await db.collection('pages').findOne({ _id: new mongoose.Types.ObjectId('69960d89cb6e38259089fdd9') })
  if (page == null) throw new Error('No page')

  console.log('=== Ask Ok Go Page ===')
  console.log('Name:', page.name, '| Slug:', page.slug)
  console.log('Blocks:', (page.blocks || []).length)

  for (const b of (page.blocks || [])) {
    console.log('\n--- Block:', b.name, '---')
    console.log('blockId:', b.blockId)
    if (b.content) {
      for (const [fid, val] of Object.entries(b.content)) {
        const v = (val as any).value
        const preview = typeof v === 'string' ? v.slice(0, 150) : JSON.stringify(v).slice(0, 300)
        console.log('  ', fid, '=', preview)
      }
    }
  }

  await mongoose.disconnect()
}
main().catch(e => { console.error(e); process.exit(1) })
