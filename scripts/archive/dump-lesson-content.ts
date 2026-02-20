import mongoose from 'mongoose'

async function main() {
  await mongoose.connect('mongodb://localhost:27017/webstir')
  const db = mongoose.connection.db
  if (db == null) throw new Error('No db')

  const page = await db.collection('pages').findOne({
    slug: 'this-too-shall-pass',
    postTypeId: { $exists: false },
  })
  if (!page) throw new Error('No page found')

  // Show all top-level keys
  console.log('Top-level keys:', Object.keys(page))
  console.log('blocks:', JSON.stringify(page.blocks).slice(0, 500))

  // Show full doc (limited)
  const full = JSON.stringify(page, null, 2)
  console.log(full.slice(0, 8000))

  await mongoose.disconnect()
}
main().catch(e => { console.error(e); process.exit(1) })
