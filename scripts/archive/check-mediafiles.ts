import mongoose from 'mongoose'

async function main() {
  await mongoose.connect('mongodb://localhost:27017/webstir')
  const db = mongoose.connection.db
  if (db == null) throw new Error('No db')

  const count = await db.collection('mediafiles').countDocuments()
  console.log(`mediafiles: ${count} documents`)

  // Find ones for our site
  const siteMedia = await db.collection('mediafiles').find({
    $or: [
      { site_id: '69952211cb6e382590893367' },
      { site_id: new mongoose.Types.ObjectId('69952211cb6e382590893367') },
      { siteId: '69952211cb6e382590893367' },
      { siteId: new mongoose.Types.ObjectId('69952211cb6e382590893367') },
    ]
  }).toArray()
  console.log(`\nFor our site: ${siteMedia.length}`)
  for (const m of siteMedia) {
    console.log(JSON.stringify(m, null, 2))
  }

  // Show any sample
  if (siteMedia.length === 0) {
    const sample = await db.collection('mediafiles').find().limit(3).toArray()
    console.log('\nSample mediafiles:')
    for (const m of sample) {
      console.log(JSON.stringify(m, null, 2).slice(0, 800))
    }
  }

  await mongoose.disconnect()
}
main().catch(e => { console.error(e); process.exit(1) })
