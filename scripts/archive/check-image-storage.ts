import mongoose from 'mongoose'

async function main() {
  await mongoose.connect('mongodb://localhost:27017/webstir')
  const db = mongoose.connection.db
  if (db == null) throw new Error('No db')

  const site = await db.collection('sites').findOne({
    _id: new mongoose.Types.ObjectId('69952211cb6e382590893367'),
  })
  if (!site) throw new Error('No site')

  // Check for media/uploads collections
  const collections = await db.listCollections().toArray()
  const mediaCollections = collections.filter(c =>
    c.name.includes('media') || c.name.includes('upload') || c.name.includes('file') || c.name.includes('image') || c.name.includes('asset')
  )
  console.log('Media-related collections:', mediaCollections.map(c => c.name))

  // Check site for R2/storage config
  console.log('\nstaticSite:', JSON.stringify(site.staticSite, null, 2))

  // Look for media/uploads collection
  for (const col of ['media', 'uploads', 'files', 'assets', 'images']) {
    const count = await db.collection(col).countDocuments().catch(() => -1)
    if (count >= 0) {
      console.log(`\n${col}: ${count} documents`)
      const sample = await db.collection(col).findOne()
      if (sample) console.log('  Sample:', JSON.stringify(sample, null, 2).slice(0, 500))
    }
  }

  await mongoose.disconnect()
}
main().catch(e => { console.error(e); process.exit(1) })
